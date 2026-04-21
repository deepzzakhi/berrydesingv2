'use client'

import type { DashboardStats } from '@/hooks/useDashboardData'
import { TIPO_LABELS } from '@/types/producto'
import type { TipoProducto } from '@/types/producto'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(value)
}

interface Props {
  stats: DashboardStats | null
  isLoading: boolean
}

function StatCard({
  icon,
  label,
  value,
  sub,
  isLoading,
}: {
  icon: string
  label: string
  value: string
  sub?: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          {isLoading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          )}
          {sub && !isLoading && (
            <p className="mt-1 text-xs text-gray-400">{sub}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export function DashboardStats({ stats, isLoading }: Props) {
  const rubroLabel = stats?.rubro_ganador
    ? TIPO_LABELS[stats.rubro_ganador.tipo as TipoProducto] ?? stats.rubro_ganador.tipo
    : '-'

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon="💰"
        label="Total cobrado"
        value={stats ? formatARS(stats.total_cobrado) : '$0'}
        isLoading={isLoading}
      />
      <StatCard
        icon="📦"
        label="Unidades cobradas"
        value={stats ? String(stats.unidades_vendidas) : '0'}
        isLoading={isLoading}
      />
      <StatCard
        icon="✓"
        label="Cobrado / Pendiente"
        value={stats ? `${stats.pagos_confirmados} / ${stats.pagos_pendientes}` : '0 / 0'}
        sub="cobrados / reservados pendientes"
        isLoading={isLoading}
      />
      <StatCard
        icon="🏆"
        label="Rubro ganador"
        value={rubroLabel}
        sub={
          stats?.rubro_ganador
            ? `${formatARS(stats.rubro_ganador.total)} (${stats.rubro_ganador.porcentaje}%)`
            : undefined
        }
        isLoading={isLoading}
      />
    </div>
  )
}
