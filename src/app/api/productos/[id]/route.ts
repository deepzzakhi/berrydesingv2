import { NextRequest, NextResponse } from 'next/server'
import { getProducto, updateProducto, deleteProducto } from '@/lib/db/productos'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateProductoSchema = z.object({
  cantidad: z.number().int().min(0).optional(),
  estado: z.enum(['stock', 'reservado', 'vendido']).optional(),
  medida: z.string().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await context.params
    const producto = await getProducto(id)

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('[GET /api/productos/[id]]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const parsed = updateProductoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const producto = await updateProducto(id, parsed.data)

    return NextResponse.json(producto)
  } catch (error) {
    console.error('[PUT /api/productos/[id]]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await context.params
    await deleteProducto(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/productos/[id]]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
