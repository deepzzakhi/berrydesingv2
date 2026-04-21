import { NextRequest, NextResponse } from 'next/server'
import { getMovimientosConFiltros, registrarMovimiento } from '@/lib/db/movimientos'
import { createClient } from '@/lib/supabase/server'
import { registrarMovimientoSchema } from '@/lib/validations/producto.schema'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

    const opts = {
      producto_id: searchParams.get('producto_id') ?? undefined,
      tipo_movimiento: searchParams.get('tipo_movimiento') ?? undefined,
      fecha_desde: searchParams.get('fecha_desde') ?? undefined,
      fecha_hasta: searchParams.get('fecha_hasta') ?? undefined,
      limit,
      offset,
    }

    const { data, total } = await getMovimientosConFiltros(opts)

    return NextResponse.json({
      data,
      total,
      hasMore: offset + data.length < total,
    })
  } catch (error) {
    console.error('[GET /api/movimientos]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = registrarMovimientoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }

    const movimiento = await registrarMovimiento(parsed.data)

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('[POST /api/movimientos]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
