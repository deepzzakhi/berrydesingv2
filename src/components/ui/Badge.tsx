'use client'

import { cn } from '@/lib/utils'
import type { EstadoProducto } from '@/types/producto'
import { ESTADO_LABELS, ESTADO_BADGE_CLASSES } from '@/types/producto'

interface BadgeEstadoProps {
  estado: EstadoProducto
  className?: string
}

export function BadgeEstado({ estado, className }: BadgeEstadoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        ESTADO_BADGE_CLASSES[estado],
        className
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-purple-100 text-purple-800 border-purple-200',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200',
    outline: 'bg-transparent text-gray-700 border-gray-300',
    destructive: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
