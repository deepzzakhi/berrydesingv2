-- Eliminar constraint UNIQUE en producto_id (permitir múltiples ventas parciales)
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_producto_id_key;

-- Agregar columna cantidad vendida
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cantidad INT NOT NULL DEFAULT 1;

-- Agregar datos del cliente
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_apellido TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_dni TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS cliente_email TEXT;
