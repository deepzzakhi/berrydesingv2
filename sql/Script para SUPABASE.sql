-- ════════════════════════════════════════════════════════════════════════════
-- Script para SUPABASE — ejecutar completo en SQL Editor
-- Berry Design v2 — idempotente (se puede correr más de una vez)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Agregar precio_unitario a productos ──────────────────────────────────

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,2) DEFAULT NULL;

-- ─── 2. Migrar enum estado_producto: vendido → cobrado ───────────────────────

DO $$
BEGIN
  -- Solo migrar si 'cobrado' aún no existe en el enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'estado_producto' AND e.enumlabel = 'cobrado'
  ) THEN
    CREATE TYPE estado_producto_new AS ENUM ('stock', 'reservado', 'cobrado');

    ALTER TABLE productos ALTER COLUMN estado DROP DEFAULT;
    ALTER TABLE productos
      ALTER COLUMN estado TYPE estado_producto_new
        USING CASE estado::text
          WHEN 'vendido' THEN 'cobrado'::estado_producto_new
          ELSE estado::text::estado_producto_new
        END;
    ALTER TABLE productos ALTER COLUMN estado SET DEFAULT 'stock'::estado_producto_new;

    ALTER TABLE movimientos
      ALTER COLUMN estado_anterior TYPE estado_producto_new
        USING CASE estado_anterior::text
          WHEN 'vendido' THEN 'cobrado'::estado_producto_new
          ELSE estado_anterior::text::estado_producto_new
        END;

    ALTER TABLE movimientos ALTER COLUMN estado_nuevo DROP DEFAULT;
    ALTER TABLE movimientos
      ALTER COLUMN estado_nuevo TYPE estado_producto_new
        USING CASE estado_nuevo::text
          WHEN 'vendido' THEN 'cobrado'::estado_producto_new
          ELSE estado_nuevo::text::estado_producto_new
        END;

    ALTER TYPE estado_producto RENAME TO estado_producto_old;
    ALTER TYPE estado_producto_new RENAME TO estado_producto;
    DROP TYPE estado_producto_old;
  END IF;
END;
$$;

-- ─── 3. Agregar 'confirmacion_pago' al enum tipo_movimiento ──────────────────

ALTER TYPE tipo_movimiento ADD VALUE IF NOT EXISTS 'confirmacion_pago';

-- ─── 4. Crear tabla pagos ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pagos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id      UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tela_id          UUID NOT NULL REFERENCES telas(id),
  tipo_producto    tipo_producto_mvp NOT NULL,
  medida           TEXT,
  cantidad         INT NOT NULL DEFAULT 1,
  monto            DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago       TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota             TEXT,
  cliente_nombre   TEXT,
  cliente_apellido TEXT,
  cliente_dni      TEXT,
  cliente_email    TEXT,
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cantidad INT NOT NULL DEFAULT 1;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_apellido TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_dni TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_direccion TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo_pago TEXT;

CREATE INDEX IF NOT EXISTS idx_pagos_fecha    ON pagos(fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario  ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_producto ON pagos(producto_id);

-- ─── 5. Tabla clientes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clientes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre    TEXT NOT NULL,
  apellido  TEXT NOT NULL,
  telefono  TEXT,
  direccion TEXT,
  email     TEXT,
  dni       TEXT,
  notas     TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_apellido ON clientes(apellido);
CREATE INDEX IF NOT EXISTS idx_clientes_email    ON clientes(email);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_write"  ON clientes;

CREATE POLICY "clientes_select" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_write"  ON clientes FOR ALL   TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin','operador') AND activo = true)
  );

-- Vincular pagos con clientes
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON pagos(cliente_id);

-- ─── 6. RLS para pagos ───────────────────────────────────────────────────────

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos_select_authenticated" ON pagos;
DROP POLICY IF EXISTS "pagos_insert_admin_operador" ON pagos;

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
