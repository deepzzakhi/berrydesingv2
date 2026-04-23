import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const editSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  dni: z.string().nullable().optional(),
  notas: z.string().max(500).nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [{ data: cliente, error }, { data: pagos }] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', params.id).single(),
    supabase
      .from('pagos')
      .select('*, producto:productos(*, tela:telas(*))')
      .eq('cliente_id', params.id)
      .order('fecha_pago', { ascending: false }),
  ])

  if (error || !cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  return NextResponse.json({ ...cliente, pagos: pagos ?? [] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const parsed = editSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .update({ ...parsed.data, email: parsed.data.email || null, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { error } = await supabase.from('clientes').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
