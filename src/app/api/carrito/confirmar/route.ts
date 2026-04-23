import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  items: z
    .array(
      z.object({
        producto_id: z.string().uuid(),
        cantidad: z.number().int().positive(),
        monto: z.number().positive(),
      })
    )
    .min(1, 'El carrito está vacío'),
  cliente: z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    telefono: z.string().min(1),
    direccion: z.string().min(1),
    metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  }),
  notas: z.string().max(500).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { items, cliente, notas } = parsed.data
  const resultados: { producto_id: string; ok: boolean; error?: string }[] = []

  for (const item of items) {
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('id, cantidad, estado, tela_id, tipo, medida')
      .eq('id', item.producto_id)
      .single()

    if (fetchError || !producto) {
      resultados.push({ producto_id: item.producto_id, ok: false, error: 'Producto no encontrado' })
      continue
    }

    if (!['stock', 'reservado'].includes(producto.estado)) {
      resultados.push({
        producto_id: item.producto_id,
        ok: false,
        error: `El producto no está disponible (estado: ${producto.estado})`,
      })
      continue
    }

    if (producto.cantidad < item.cantidad) {
      resultados.push({
        producto_id: item.producto_id,
        ok: false,
        error: `Stock insuficiente (disponible: ${producto.cantidad})`,
      })
      continue
    }

    const nuevaCantidad = producto.cantidad - item.cantidad
    const nuevoEstado = nuevaCantidad <= 0 ? 'cobrado' : producto.estado

    // Decrement stock
    const { error: updateError } = await supabase
      .from('productos')
      .update({ cantidad: nuevaCantidad, estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', item.producto_id)

    if (updateError) {
      resultados.push({ producto_id: item.producto_id, ok: false, error: updateError.message })
      continue
    }

    // Create pago record
    await supabase.from('pagos').insert({
      producto_id: item.producto_id,
      tela_id: producto.tela_id,
      tipo_producto: producto.tipo,
      medida: producto.medida ?? null,
      cantidad: item.cantidad,
      monto: item.monto,
      fecha_pago: new Date().toISOString(),
      cliente_nombre: cliente.nombre,
      cliente_apellido: cliente.apellido,
      cliente_telefono: cliente.telefono,
      cliente_direccion: cliente.direccion,
      metodo_pago: cliente.metodo_pago,
      nota: notas ?? null,
      usuario_id: user.id,
    })

    // Register movimiento
    await supabase.from('movimientos').insert({
      producto_id: item.producto_id,
      tipo_movimiento: 'confirmacion_pago',
      estado_anterior: producto.estado,
      estado_nuevo: nuevoEstado,
      cantidad_delta: item.cantidad,
      usuario_id: user.id,
      notas: notas ?? null,
    })

    resultados.push({ producto_id: item.producto_id, ok: true })
  }

  const exitosos = resultados.filter((r) => r.ok).length
  const fallidos = resultados.filter((r) => !r.ok)

  if (exitosos === 0) {
    return NextResponse.json(
      { error: 'No se pudo procesar ningún item', detalles: fallidos },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { exitosos, fallidos, resultados },
    { status: exitosos === items.length ? 200 : 207 }
  )
}
