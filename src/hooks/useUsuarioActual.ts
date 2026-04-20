'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Usuario } from '@/types/producto'

export function useUsuarioActual() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUsuario(data ?? null)
      setIsLoading(false)
    })
  }, [])

  return { usuario, isLoading }
}
