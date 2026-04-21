-- ─── 1. Agregar precio_unitario a productos ─────────────────────────────────

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,2) DEFAULT NULL;

-- ─── 2. Migrar enum estado_producto: vendido → cobrado ───────────────────────

-- 2a. Crear nuevo enum con el valor correcto
CREATE TYPE estado_producto_new AS ENUM ('stock', 'reservado', 'cobrado');

-- 2b. Cambiar columna de productos
--     Primero eliminamos el DEFAULT para que no interfiera con el ALTER TYPE,
--     luego hacemos el cambio y restauramos el DEFAULT con el tipo nuevo.
ALTER TABLE productos ALTER COLUMN estado DROP DEFAULT;

ALTER TABLE productos
  ALTER COLUMN estado TYPE estado_producto_new
    USING CASE estado::text
      WHEN 'vendido' THEN 'cobrado'::estado_producto_new
      ELSE estado::text::estado_producto_new
    END;

ALTER TABLE productos ALTER COLUMN estado SET DEFAULT 'stock'::estado_producto_new;

-- 2c. Cambiar columna estado_anterior en movimientos (nullable, sin DEFAULT)
ALTER TABLE movimientos
  ALTER COLUMN estado_anterior TYPE estado_producto_new
    USING CASE estado_anterior::text
      WHEN 'vendido' THEN 'cobrado'::estado_producto_new
      ELSE estado_anterior::text::estado_producto_new
    END;

-- 2d. Cambiar columna estado_nuevo en movimientos
ALTER TABLE movimientos ALTER COLUMN estado_nuevo DROP DEFAULT;

ALTER TABLE movimientos
  ALTER COLUMN estado_nuevo TYPE estado_producto_new
    USING CASE estado_nuevo::text
      WHEN 'vendido' THEN 'cobrado'::estado_producto_new
      ELSE estado_nuevo::text::estado_producto_new
    END;

-- 2e. Renombrar los enums
ALTER TYPE estado_producto RENAME TO estado_producto_old;
ALTER TYPE estado_producto_new RENAME TO estado_producto;
DROP TYPE estado_producto_old;

-- ─── 3. Agregar 'confirmacion_pago' al enum tipo_movimiento ──────────────────

ALTER TYPE tipo_movimiento ADD VALUE IF NOT EXISTS 'confirmacion_pago';

-- ─── 4. Crear tabla pagos ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pagos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id  UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
  tela_id      UUID NOT NULL REFERENCES telas(id),
  tipo_producto tipo_producto_mvp NOT NULL,
  medida       TEXT,
  monto        DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago   TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota         TEXT,
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha    ON pagos(fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario  ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_producto ON pagos(producto_id);

-- ─── 5. RLS para pagos ───────────────────────────────────────────────────────

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select_authenticated"
  ON pagos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pagos_insert_admin_operador"
  ON pagos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'operador')
        AND activo = true
    )
  );
