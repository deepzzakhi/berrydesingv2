'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Package, ArrowLeftRight, Upload, Users, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard, roles: ['admin','operador','consulta'] },
  { label: 'Inventario',   href: '/inventario',  icon: Package,        roles: ['admin','operador','consulta'] },
  { label: 'Movimientos',  href: '/movimientos', icon: ArrowLeftRight, roles: ['admin','operador','consulta'] },
  { label: 'Importar',     href: '/importar',    icon: Upload,         roles: ['admin','operador'] },
  { label: 'Usuarios',     href: '/admin/usuarios',     icon: Users,   roles: ['admin'] },
  { label: 'Configuración',href: '/admin/configuracion',icon: Settings, roles: ['admin'] },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario } = useUsuarioActual()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(
    (item) => !usuario || (item.roles as readonly string[]).includes(usuario.rol)
  )

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#851919]">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#851919] leading-tight">Berry Design</p>
            <p className="text-xs text-gray-400 leading-tight">Stock Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-red-50 text-[#851919]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon size={18} className={cn('shrink-0', isActive ? 'text-[#851919]' : 'text-gray-400')} />
                  {item.label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#851919]" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-100 p-3 space-y-1">
        {usuario && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-900 truncate">{usuario.nombre ?? usuario.email}</p>
            <p className="text-xs text-gray-400 capitalize">{usuario.rol}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="shrink-0 text-gray-400" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
