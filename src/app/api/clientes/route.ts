import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const clienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  dni: z.string().nullable().optional(),
  notas: z.string().max(500).nullable().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const busqueda = searchParams.get('busqueda') ?? ''

  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .order('apellido', { ascending: true })

  if (busqueda) {
    query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,email.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const parsed = clienteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({ ...parsed.data, email: parsed.data.email || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
