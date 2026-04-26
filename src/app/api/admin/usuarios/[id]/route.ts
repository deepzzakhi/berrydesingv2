import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRol, AuthError } from '@/lib/auth/requireRol'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    await requireRol(supabase, ['admin'])

    const body = await request.json() as { email?: string; password?: string; nombre?: string }
    const { email, password, nombre } = body

    if (!email && !password && !nombre) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Actualizar auth (email y/o password)
    if (email || password) {
      const authUpdates: { email?: string; password?: string } = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password

      const { error: authErr } = await admin.auth.admin.updateUserById(params.id, authUpdates)
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    }

    // Actualizar tabla usuarios (email y/o nombre)
    const tableUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (email) tableUpdates.email = email
    if (nombre !== undefined) tableUpdates.nombre = nombre

    const { error: dbErr } = await admin
      .from('usuarios')
      .update(tableUpdates)
      .eq('id', params.id)

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
