import { NextRequest, NextResponse } from 'next/server'
import { getProductos, createProducto } from '@/lib/db/productos'
import { createClient } from '@/lib/supabase/server'
import { createProductoSchema, filtrosInventarioSchema } from '@/lib/validations/producto.schema'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filtrosRaw = {
      busqueda: searchParams.get('busqueda') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      tipo: searchParams.get('tipo') ?? undefined,
    }

    const parsed = filtrosInventarioSchema.safeParse(filtrosRaw)
    const filtros = parsed.success ? parsed.data : {}

    const productos = await getProductos(filtros)

    return NextResponse.json(productos)
  } catch (error) {
    console.error('[GET /api/productos]', error)
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
    const parsed = createProductoSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const producto = await createProducto(parsed.data)

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('[POST /api/productos]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
