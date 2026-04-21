import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRol, AuthError } from '@/lib/auth/requireRol'
import { z } from 'zod'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('estados_producto_config')
      .select('*')
      .eq('activo', true)
      .order('orden')

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error al obtener estados' }, { status: 500 })
  }
}

const estadoSchema = z.object({
  codigo: z.string().min(1).regex(/^[a-z_]+$/),
  nombre: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#6b7280'),
  badge_class: z.string().default('bg-gray-100 text-gray-600 border-gray-200'),
  es_terminal: z.boolean().default(false),
  transiciones: z.array(z.string()).default([]),
  orden: z.number().int().default(0),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireRol(supabase, ['admin'])

    const body = await request.json()
    const parsed = estadoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('estados_producto_config')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe ese código' }, { status: 409 })
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
