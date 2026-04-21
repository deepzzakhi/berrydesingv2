'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { HistorialTimeline } from '@/components/movimientos/HistorialTimeline'
import type { TipoMovimiento } from '@/types/producto'
import { MOVIMIENTO_LABELS } from '@/types/producto'
import { useMovimientos } from '@/hooks/useMovimientos'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type TipoFiltro = TipoMovimiento | 'todos'

const TIPO_OPTIONS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos los movimientos' },
  { value: 'ingreso_stock', label: MOVIMIENTO_LABELS.ingreso_stock },
  { value: 'reserva', label: MOVIMIENTO_LABELS.reserva },
  { value: 'confirmacion_venta', label: MOVIMIENTO_LABELS.confirmacion_venta },
  { value: 'devolucion_stock', label: MOVIMIENTO_LABELS.devolucion_stock },
  { value: 'ajuste_cantidad', label: MOVIMIENTO_LABELS.ajuste_cantidad },
]

export default function MovimientosPage() {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const { movimientos, total, isLoading, mutate } = useMovimientos({
    tipoMovimiento: tipoFiltro,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Movimientos" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Tipo de movimiento</label>
            <div className="relative">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                className="flex h-9 appearance-none rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="flex h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="flex h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {(tipoFiltro !== 'todos' || fechaDesde || fechaHasta) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTipoFiltro('todos')
                  setFechaDesde('')
                  setFechaHasta('')
                }}
              >
                Limpiar
              </Button>
            )}
            <Button variant="outline" size="icon-sm" onClick={() => mutate()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          {isLoading ? 'Cargando...' : `${total} movimientos`}
        </p>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <HistorialTimeline movimientos={movimientos} />
        )}
      </div>
    </div>
  )
}
