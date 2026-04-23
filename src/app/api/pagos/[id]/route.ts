import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const editSchema = z.object({
  cliente_nombre: z.string().min(1).optional(),
  cliente_apellido: z.string().min(1).optional(),
  cliente_telefono: z.string().optional(),
  cliente_direccion: z.string().optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']).optional(),
  nota: z.string().max(500).nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('pagos')
    .select('*, producto:productos(*, tela:telas(*)), usuario:usuarios(id, nombre, email)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

  return NextResponse.json(data)
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
    .from('pagos')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
