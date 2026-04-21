'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { PeriodoSelector } from '@/components/dashboard/PeriodoSelector'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { VentasMensualesChart } from '@/components/dashboard/VentasMensualesChart'
import { VentasPorRubroChart } from '@/components/dashboard/VentasPorRubroChart'
import { TopProductosTable } from '@/components/dashboard/TopProductosTable'
import { UltimosPagosTable } from '@/components/dashboard/UltimosPagosTable'
import type { PeriodoFiltro } from '@/components/dashboard/PeriodoSelector'
import {
  useDashboardStats,
  useVentasMensuales,
  useVentasPorRubro,
  useTopProductos,
  useUltimosPagos,
} from '@/hooks/useDashboardData'

function getMesActualFiltro(): PeriodoFiltro {
  const now = new Date()
  const desde = new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    fecha_desde: desde.toISOString().split('T')[0],
    fecha_hasta: hasta.toISOString().split('T')[0],
  }
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(getMesActualFiltro)

  const { stats, isLoading: statsLoading } = useDashboardStats(periodo)
  const { ventas, isLoading: ventasLoading } = useVentasMensuales(periodo)
  const { rubros, isLoading: rubrosLoading } = useVentasPorRubro(periodo)
  const { topProductos, isLoading: topLoading } = useTopProductos(periodo)
  const { ultimosPagos, isLoading: pagosLoading } = useUltimosPagos(periodo)

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header + periodo selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm text-gray-500">Análisis financiero de ventas</h2>
          </div>
          <PeriodoSelector onChange={setPeriodo} />
        </div>

        {/* KPI Cards */}
        <DashboardStats stats={stats} isLoading={statsLoading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <VentasMensualesChart data={ventas} isLoading={ventasLoading} />
          <VentasPorRubroChart data={rubros} isLoading={rubrosLoading} />
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <TopProductosTable data={topProductos} isLoading={topLoading} />
          <UltimosPagosTable data={ultimosPagos} isLoading={pagosLoading} />
        </div>
      </div>
    </div>
  )
}
