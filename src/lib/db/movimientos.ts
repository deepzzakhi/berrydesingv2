import { createClient } from '@/lib/supabase/server'
import type { Movimiento, RegistrarMovimientoInput } from '@/types/producto'

export async function getMovimientos(producto_id?: string): Promise<Movimiento[]> {
  const supabase = await createClient()

  let query = supabase
    .from('movimientos')
    .select(
      `
      *,
      producto:productos(
        *,
        tela:telas(*)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (producto_id) {
    query = query.eq('producto_id', producto_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener movimientos:', error)
    throw new Error('No se pudieron obtener los movimientos')
  }

  return (data ?? []) as Movimiento[]
}

export async function registrarMovimiento(
  input: RegistrarMovimientoInput
): Promise<Movimiento> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('registrar_movimiento', {
    p_producto_id: input.producto_id,
    p_tipo_movimiento: input.tipo_movimiento,
    p_cantidad_delta: input.cantidad_delta ?? 0,
    p_orden_bondarea: input.orden_bondarea ?? null,
    p_cliente: input.cliente ?? null,
    p_usuario_id: user?.id ?? null,
    p_notas: input.notas ?? null,
  })

  if (error) {
    console.error('Error al registrar movimiento:', error)
    throw new Error(error.message ?? 'No se pudo registrar el movimiento')
  }

  // Fetch the created movimiento
  const { data: movimiento, error: fetchError } = await supabase
    .from('movimientos')
    .select(
      `
      *,
      producto:productos(
        *,
        tela:telas(*)
      )
    `
    )
    .eq('id', data)
    .single()

  if (fetchError) {
    throw new Error('Movimiento registrado pero no se pudo obtener el resultado')
  }

  return movimiento as Movimiento
}

export async function getMovimientosConFiltros(opts: {
  producto_id?: string
  tipo_movimiento?: string
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<Movimiento[]> {
  const supabase = await createClient()

  let query = supabase
    .from('movimientos')
    .select(
      `
      *,
      producto:productos(
        *,
        tela:telas(*)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (opts.producto_id) {
    query = query.eq('producto_id', opts.producto_id)
  }

  if (opts.tipo_movimiento && opts.tipo_movimiento !== 'todos') {
    query = query.eq('tipo_movimiento', opts.tipo_movimiento)
  }

  if (opts.fecha_desde) {
    query = query.gte('created_at', opts.fecha_desde)
  }

  if (opts.fecha_hasta) {
    query = query.lte('created_at', opts.fecha_hasta)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener movimientos:', error)
    throw new Error('No se pudieron obtener los movimientos')
  }

  return (data ?? []) as Movimiento[]
}
