'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import type { RolUsuario } from '@/types/producto'
import { ShieldOff } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: RolUsuario[]
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, children, redirectTo }: RoleGuardProps) {
  const { usuario, isLoading } = useUsuarioActual()
  const router = useRouter()

  const hasAccess = usuario && allowedRoles.includes(usuario.rol)

  useEffect(() => {
    if (!isLoading && !hasAccess && redirectTo) {
      router.replace(redirectTo)
    }
  }, [isLoading, hasAccess, redirectTo, router])

  if (isLoading) return null

  if (!hasAccess) {
    if (redirectTo) return null
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-center p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Sin acceso</p>
          <p className="text-sm text-gray-500 mt-1">No tenés permisos para ver esta sección.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
