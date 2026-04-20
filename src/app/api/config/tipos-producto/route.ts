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
      .from('tipos_producto')
      .select('*')
      .eq('activo', true)
      .order('orden')

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener tipos' }, { status: 500 })
  }
}

const tipoSchema = z.object({
  codigo: z.string().min(1).regex(/^[a-z_]+$/, 'Solo minúsculas y guiones bajos'),
  nombre: z.string().min(1),
  requiere_medida: z.boolean().default(false),
  orden: z.number().int().default(0),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await requireRol(supabase, ['admin'])

    const body = await request.json()
    const parsed = tipoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tipos_producto')
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
