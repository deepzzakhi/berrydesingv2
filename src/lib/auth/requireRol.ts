import type { SupabaseClient } from '@supabase/supabase-js'
import type { RolUsuario } from '@/types/producto'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

export async function requireRol(
  supabase: SupabaseClient,
  roles: RolUsuario[]
): Promise<{ userId: string; rol: RolUsuario }> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new AuthError('No autenticado', 401)

  const { data, error } = await supabase
    .from('usuarios')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  if (error || !data) throw new AuthError('Usuario no encontrado', 401)
  if (!data.activo) throw new AuthError('Usuario desactivado', 403)
  if (!roles.includes(data.rol as RolUsuario)) {
    throw new AuthError('Sin permisos para esta acción', 403)
  }

  return { userId: user.id, rol: data.rol as RolUsuario }
}
