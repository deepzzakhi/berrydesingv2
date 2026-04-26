-- ════════════════════════════════════════════════════════════════════════════
-- Berry Stock — Modelo de precio por metro de tela
--
-- Lógica:
--   precio_unitario = tela.precio_por_metro × metros_efectivos
--   metros_efectivos = producto.metros_tela ?? tipo.metros_por_unidad
--
-- Las alfombras vinílicas tienen metros_por_unidad = NULL porque dependen
-- de la medida (120x180, etc). Se cargan por producto individualmente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. precio_por_metro en telas ─────────────────────────────────────────────

ALTER TABLE telas
  ADD COLUMN IF NOT EXISTS precio_por_metro DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN telas.precio_por_metro IS
  'Precio por metro de tela en ARS. Base para calcular precio_unitario de productos.';

-- ── 2. metros_por_unidad en tipos_producto ────────────────────────────────────

ALTER TABLE tipos_producto
  ADD COLUMN IF NOT EXISTS metros_por_unidad DECIMAL(6,3) DEFAULT NULL;

COMMENT ON COLUMN tipos_producto.metros_por_unidad IS
  'Metros de tela consumidos por unidad de este tipo. NULL = variable (alfombras).';

-- Valores por defecto — ajustar según la realidad de Berry Design
UPDATE tipos_producto SET metros_por_unidad = 0.500 WHERE codigo = 'matera';
UPDATE tipos_producto SET metros_por_unidad = 0.200 WHERE codigo = 'porta_anteojos';
UPDATE tipos_producto SET metros_por_unidad = 0.400 WHERE codigo = 'cubre_bidon';
UPDATE tipos_producto SET metros_por_unidad = NULL  WHERE codigo = 'alfombra_vinilica';

-- ── 3. metros_tela en productos (override por producto) ───────────────────────

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS metros_tela DECIMAL(6,3) DEFAULT NULL;

COMMENT ON COLUMN productos.metros_tela IS
  'Override de metros por unidad para este producto específico. '
  'Si es NULL, se usa tipos_producto.metros_por_unidad. '
  'Obligatorio para alfombras vinílicas.';

-- ── 4. Función central de cálculo ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calcular_precio_unitario(
  p_tela_id      UUID,
  p_tipo         TEXT,
  p_metros_tela  DECIMAL DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN t.precio_por_metro IS NULL THEN NULL
      WHEN p_metros_tela IS NOT NULL
        THEN ROUND(t.precio_por_metro * p_metros_tela, 2)
      WHEN tp.metros_por_unidad IS NOT NULL
        THEN ROUND(t.precio_por_metro * tp.metros_por_unidad, 2)
      ELSE NULL
    END
  FROM telas t
  LEFT JOIN tipos_producto tp ON tp.codigo = p_tipo
  WHERE t.id = p_tela_id
$$;

-- ── 5. Trigger: recalcula precio_unitario al insertar/modificar un producto ───

CREATE OR REPLACE FUNCTION trg_sync_precio_producto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.precio_unitario := calcular_precio_unitario(
    NEW.tela_id,
    NEW.tipo::text,
    NEW.metros_tela
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS productos_sync_precio ON productos;
CREATE TRIGGER productos_sync_precio
  BEFORE INSERT OR UPDATE OF tela_id, tipo, metros_tela
  ON productos
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_precio_producto();

-- ── 6. Trigger: propaga cambio de precio de tela a sus productos ──────────────

CREATE OR REPLACE FUNCTION trg_sync_precio_desde_tela()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.precio_por_metro IS DISTINCT FROM OLD.precio_por_metro THEN
    UPDATE productos p
    SET precio_unitario = calcular_precio_unitario(p.tela_id, p.tipo::text, p.metros_tela),
        updated_at      = now()
    WHERE p.tela_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS telas_sync_precio ON telas;
CREATE TRIGGER telas_sync_precio
  AFTER UPDATE OF precio_por_metro ON telas
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_precio_desde_tela();

-- ── 7. Trigger: propaga cambio de metros estándar del tipo a sus productos ────

CREATE OR REPLACE FUNCTION trg_sync_precio_desde_tipo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.metros_por_unidad IS DISTINCT FROM OLD.metros_por_unidad THEN
    -- Solo actualiza productos que NO tienen override propio
    UPDATE productos p
    SET precio_unitario = calcular_precio_unitario(p.tela_id, p.tipo::text, p.metros_tela),
        updated_at      = now()
    WHERE p.tipo::text = NEW.codigo
      AND p.metros_tela IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tipos_sync_precio ON tipos_producto;
CREATE TRIGGER tipos_sync_precio
  AFTER UPDATE OF metros_por_unidad ON tipos_producto
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_precio_desde_tipo();

-- ── 8. RPC: calcular monto total de una venta ─────────────────────────────────

CREATE OR REPLACE FUNCTION calcular_monto_venta(
  p_producto_id UUID,
  p_cantidad    INT DEFAULT 1
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN precio_unitario IS NOT NULL
        THEN ROUND(precio_unitario * p_cantidad, 2)
      ELSE NULL
    END
  FROM productos
  WHERE id = p_producto_id
$$;

COMMENT ON FUNCTION calcular_monto_venta IS
  'Retorna precio_unitario × cantidad. Usá este RPC desde la app al confirmar una venta.';

-- ── 9. Columnas faltantes en pagos ────────────────────────────────────────────
-- (005 agregó cantidad, cliente_nombre, cliente_apellido, cliente_dni, cliente_email)
-- Faltan: teléfono, dirección, método de pago y FK a clientes

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_direccion TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo_pago      TEXT DEFAULT 'efectivo'
  CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'mercado_pago'));
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_id       UUID
  REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);

-- ── 10. Unique constraint en importaciones Bondarea ───────────────────────────
-- Evita importar el mismo número de orden dos veces

ALTER TABLE movimientos
  DROP CONSTRAINT IF EXISTS uq_movimientos_orden_bondarea;

ALTER TABLE movimientos
  ADD CONSTRAINT uq_movimientos_orden_bondarea
  UNIQUE (orden_bondarea)
  DEFERRABLE INITIALLY DEFERRED;

-- Nota: DEFERRABLE permite que una misma importación batch inserte múltiples
-- movimientos con el mismo orden sin fallar (se valida al COMMIT).
-- Si preferís que el mismo orden pueda tener varios movimientos (reserva + venta),
-- eliminá este constraint y manejá la deduplicación en la app.

-- ── 11. Recalcular precios existentes ─────────────────────────────────────────

UPDATE productos p
SET precio_unitario = calcular_precio_unitario(p.tela_id, p.tipo::text, p.metros_tela)
WHERE precio_unitario IS NULL;

-- ── 12. View útil: productos con todos los datos de precio ────────────────────

CREATE OR REPLACE VIEW v_productos_precio AS
SELECT
  p.id,
  p.tela_id,
  t.codigo                                          AS codigo_tela,
  t.precio_por_metro,
  p.tipo::text                                      AS tipo,
  tp.nombre                                         AS tipo_nombre,
  COALESCE(p.metros_tela, tp.metros_por_unidad)     AS metros_efectivos,
  p.metros_tela                                     AS metros_override,
  tp.metros_por_unidad                              AS metros_tipo,
  p.precio_unitario,
  p.cantidad,
  CASE
    WHEN p.precio_unitario IS NOT NULL
      THEN ROUND(p.precio_unitario * p.cantidad, 2)
    ELSE NULL
  END                                               AS valor_stock_total
FROM productos p
JOIN telas t ON t.id = p.tela_id
LEFT JOIN tipos_producto tp ON tp.codigo = p.tipo::text;

COMMENT ON VIEW v_productos_precio IS
  'Vista de productos con desglose completo de precio: tela, metros, precio unitario y valor total en stock.';
