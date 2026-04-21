import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const confirmarCarritoSchema = z.object({
  items: z
    .array(
      z.object({
        producto_id: z.string().uuid(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1, 'El carrito está vacío'),
  notas: z.string().max(500).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = confirmarCarritoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { items, notas } = parsed.data
  const resultados: { producto_id: string; ok: boolean; error?: string }[] = []

  for (const item of items) {
    // Fetch current stock
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('id, cantidad, estado')
      .eq('id', item.producto_id)
      .single()

    if (fetchError || !producto) {
      resultados.push({ producto_id: item.producto_id, ok: false, error: 'Producto no encontrado' })
      continue
    }

    if (producto.estado !== 'stock') {
      resultados.push({
        producto_id: item.producto_id,
        ok: false,
        error: `El producto no está en stock (estado: ${producto.estado})`,
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

    // Decrement stock
    const { error: updateError } = await supabase
      .from('productos')
      .update({
        cantidad: nuevaCantidad,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.producto_id)

    if (updateError) {
      resultados.push({ producto_id: item.producto_id, ok: false, error: updateError.message })
      continue
    }

    // Register movimiento
    await supabase.from('movimientos').insert({
      producto_id: item.producto_id,
      tipo_movimiento: 'confirmacion_venta',
      estado_anterior: producto.estado,
      estado_nuevo: producto.estado,
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
