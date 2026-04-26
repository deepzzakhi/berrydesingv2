-- ════════════════════════════════════════════════════════════════════════════
-- Berry Stock — Fix estado cobrado
--
-- Bug: registrar_movimiento siempre ponía estado='cobrado' al vender,
--      sin importar si quedaban unidades en stock.
--
-- Fix:
--   1. Datos existentes: reset a 'stock' los productos cobrado con cantidad > 0
--   2. Función registrar_movimiento: solo cobra cuando cantidad llega a 0
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Corregir datos existentes ──────────────────────────────────────────────

UPDATE productos
SET
  estado     = 'stock',
  updated_at = now()
WHERE
  estado   = 'cobrado'
  AND cantidad > 0;

-- ── 2. Corregir función registrar_movimiento ──────────────────────────────────

CREATE OR REPLACE FUNCTION registrar_movimiento(
  p_producto_id    uuid,
  p_tipo_movimiento tipo_movimiento,
  p_cantidad_delta integer default 0,
  p_orden_bondarea text default null,
  p_cliente        text default null,
  p_usuario_id     uuid default null,
  p_notas          text default null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_producto          productos%rowtype;
  v_estado_anterior   estado_producto;
  v_estado_nuevo      estado_producto;
  v_nueva_cantidad    integer;
  v_movimiento_id     uuid;
BEGIN
  SELECT * INTO v_producto
  FROM productos
  WHERE id = p_producto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_producto_id;
  END IF;

  v_estado_anterior := v_producto.estado;
  v_estado_nuevo    := v_producto.estado;
  v_nueva_cantidad  := v_producto.cantidad;

  CASE p_tipo_movimiento

    WHEN 'ingreso_stock' THEN
      v_estado_nuevo   := 'stock';
      v_nueva_cantidad := v_producto.cantidad + COALESCE(p_cantidad_delta, 0);

    WHEN 'reserva' THEN
      IF v_producto.estado != 'stock' THEN
        RAISE EXCEPTION 'Solo se pueden reservar productos en estado "stock". Estado actual: %', v_producto.estado;
      END IF;
      v_estado_nuevo := 'reservado';

    WHEN 'confirmacion_venta' THEN
      IF v_producto.estado NOT IN ('stock', 'reservado') THEN
        RAISE EXCEPTION 'Solo se pueden vender productos en estado "stock" o "reservado". Estado actual: %', v_producto.estado;
      END IF;
      v_nueva_cantidad := GREATEST(0, v_producto.cantidad - COALESCE(p_cantidad_delta, 1));
      -- Solo marca cobrado cuando se agota el stock
      v_estado_nuevo := CASE
        WHEN v_nueva_cantidad <= 0 THEN 'cobrado'::estado_producto
        ELSE v_producto.estado
      END;

    WHEN 'confirmacion_pago' THEN
      IF v_producto.estado NOT IN ('stock', 'reservado') THEN
        RAISE EXCEPTION 'Solo se pueden confirmar pagos de productos en estado "stock" o "reservado". Estado actual: %', v_producto.estado;
      END IF;
      v_nueva_cantidad := GREATEST(0, v_producto.cantidad - COALESCE(p_cantidad_delta, 1));
      -- Solo marca cobrado cuando se agota el stock
      v_estado_nuevo := CASE
        WHEN v_nueva_cantidad <= 0 THEN 'cobrado'::estado_producto
        ELSE v_producto.estado
      END;

    WHEN 'devolucion_stock' THEN
      v_estado_nuevo   := 'stock';
      v_nueva_cantidad := v_producto.cantidad + COALESCE(p_cantidad_delta, 0);

    WHEN 'ajuste_cantidad' THEN
      v_nueva_cantidad := GREATEST(0, v_producto.cantidad + COALESCE(p_cantidad_delta, 0));
      -- Si el ajuste deja en 0 y estaba cobrado, lo mantiene; si deja > 0 y estaba cobrado, lo libera
      IF v_producto.estado = 'cobrado' AND v_nueva_cantidad > 0 THEN
        v_estado_nuevo := 'stock';
      END IF;

    ELSE
      RAISE EXCEPTION 'Tipo de movimiento no reconocido: %', p_tipo_movimiento;
  END CASE;

  UPDATE productos
  SET
    estado     = v_estado_nuevo,
    cantidad   = v_nueva_cantidad,
    updated_at = now()
  WHERE id = p_producto_id;

  INSERT INTO movimientos (
    producto_id,
    tipo_movimiento,
    estado_anterior,
    estado_nuevo,
    cantidad_delta,
    orden_bondarea,
    cliente,
    usuario_id,
    notas
  )
  VALUES (
    p_producto_id,
    p_tipo_movimiento,
    v_estado_anterior,
    v_estado_nuevo,
    COALESCE(p_cantidad_delta, 0),
    p_orden_bondarea,
    p_cliente,
    p_usuario_id,
    p_notas
  )
  RETURNING id INTO v_movimiento_id;

  RETURN v_movimiento_id;
END;
$$;
