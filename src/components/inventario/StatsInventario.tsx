'use client'

import { Package, Clock, CheckCircle, Archive } from 'lucide-react'

interface StatsInventarioProps {
  stats: {
    total: number
    stock: number
    reservado: number
    vendido: number
  }
}

export function StatsInventario({ stats }: StatsInventarioProps) {
  const items = [
    {
      label: 'Total productos',
      value: stats.total,
      icon: Package,
      iconBg: 'bg-purple-100',
      iconColor: 'text-[#853f9a]',
      valueColor: 'text-gray-900',
    },
    {
      label: 'En stock',
      value: stats.stock,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      valueColor: 'text-green-700',
    },
    {
      label: 'Reservados',
      value: stats.reservado,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Vendidos',
      value: stats.vendido,
      icon: Archive,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      valueColor: 'text-gray-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg}`}>
              <Icon size={20} className={item.iconColor} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${item.valueColor}`}>
                {item.value}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
