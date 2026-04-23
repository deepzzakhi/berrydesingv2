import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { venderSchema } from '@/lib/validations/producto.schema'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)
  const offset = Number(searchParams.get('offset') ?? 0)
  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')
  const usuario_id = searchParams.get('usuario_id')

  let query = supabase
    .from('pagos')
    .select('*, producto:productos(*, tela:telas(*)), usuario:usuarios(id, nombre, email)', {
      count: 'exact',
    })
    .order('fecha_pago', { ascending: false })

  if (fecha_desde) query = query.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    query = query.lte('fecha_pago', hasta.toISOString())
  }
  if (usuario_id) query = query.eq('usuario_id', usuario_id)
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'No se pudieron obtener los pagos' }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0, hasMore: offset + limit < (count ?? 0) })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  if (!usuario?.activo || !['admin', 'operador'].includes(usuario.rol)) {
    return NextResponse.json({ error: 'Sin permisos para registrar ventas' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = venderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { producto_id, cantidad, monto, fecha_pago, cliente_nombre, cliente_apellido, cliente_dni, cliente_email, nota } = parsed.data

  // Fetch product
  const { data: producto, error: productoError } = await supabase
    .from('productos')
    .select('*, tela:telas(*)')
    .eq('id', producto_id)
    .single()

  if (productoError || !producto) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  if (!['stock', 'reservado'].includes(producto.estado)) {
    return NextResponse.json({ error: 'El producto ya fue cobrado' }, { status: 400 })
  }

  if (producto.cantidad < cantidad) {
    return NextResponse.json(
      { error: `Stock insuficiente. Disponible: ${producto.cantidad}` },
      { status: 400 }
    )
  }

  // Insert pago
  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .insert({
      producto_id,
      tela_id: producto.tela_id,
      tipo_producto: producto.tipo,
      medida: producto.medida,
      cantidad,
      monto,
      fecha_pago,
      nota: nota ?? null,
      cliente_nombre,
      cliente_apellido,
      cliente_dni: cliente_dni ?? null,
      cliente_email: cliente_email || null,
      usuario_id: user.id,
    })
    .select()
    .single()

  if (pagoError) {
    console.error('[POST /api/pagos] pagoError:', JSON.stringify(pagoError))
    return NextResponse.json({ error: pagoError.message ?? 'No se pudo registrar la venta', detail: pagoError }, { status: 500 })
  }

  // Decrement stock; move to cobrado when empty
  const nuevaCantidad = producto.cantidad - cantidad
  const nuevoEstado = nuevaCantidad <= 0 ? 'cobrado' : producto.estado

  await supabase
    .from('productos')
    .update({ cantidad: nuevaCantidad, estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', producto_id)

  // Register movimiento
  await supabase.from('movimientos').insert({
    producto_id,
    tipo_movimiento: 'confirmacion_pago',
    estado_anterior: producto.estado,
    estado_nuevo: nuevoEstado,
    cantidad_delta: cantidad,
    usuario_id: user.id,
    notas: nota ?? null,
  })

  return NextResponse.json(pago, { status: 201 })
}
