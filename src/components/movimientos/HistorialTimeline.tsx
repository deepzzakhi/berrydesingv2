'use client'

import type { Movimiento } from '@/types/producto'
import { MOVIMIENTO_LABELS } from '@/types/producto'
import { BadgeEstado } from '@/components/ui/Badge'
import { formatDatetime } from '@/lib/utils'
import {
  ArrowDownCircle,
  Clock,
  CheckCircle,
  RotateCcw,
  SlidersHorizontal,
  User,
  FileText,
  Hash,
} from 'lucide-react'

interface HistorialTimelineProps {
  movimientos: Movimiento[]
  className?: string
}

const MOVIMIENTO_ICON: Record<string, React.ElementType> = {
  ingreso_stock: ArrowDownCircle,
  reserva: Clock,
  confirmacion_venta: CheckCircle,
  devolucion_stock: RotateCcw,
  ajuste_cantidad: SlidersHorizontal,
}

const MOVIMIENTO_ICON_COLOR: Record<string, string> = {
  ingreso_stock: 'text-blue-600 bg-blue-50 border-blue-200',
  reserva: 'text-amber-600 bg-amber-50 border-amber-200',
  confirmacion_venta: 'text-green-600 bg-green-50 border-green-200',
  devolucion_stock: 'text-purple-600 bg-purple-50 border-purple-200',
  ajuste_cantidad: 'text-gray-600 bg-gray-50 border-gray-200',
}

export function HistorialTimeline({ movimientos, className }: HistorialTimelineProps) {
  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={40} className="text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-500">Sin movimientos</p>
        <p className="text-xs text-gray-400">No hay historial de movimientos todavía</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <ol className="relative border-l border-gray-200 space-y-0">
        {movimientos.map((mov, idx) => {
          const Icon = MOVIMIENTO_ICON[mov.tipo_movimiento] ?? Clock
          const iconClasses =
            MOVIMIENTO_ICON_COLOR[mov.tipo_movimiento] ??
            'text-gray-500 bg-gray-50 border-gray-200'
          const isLast = idx === movimientos.length - 1

          return (
            <li key={mov.id} className="relative pb-6 pl-8">
              {/* Timeline dot */}
              <div
                className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 ${iconClasses}`}
              >
                <Icon size={14} />
              </div>

              {/* Content card */}
              <div
                className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                  !isLast ? '' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {MOVIMIENTO_LABELS[mov.tipo_movimiento] ?? mov.tipo_movimiento}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDatetime(mov.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {mov.estado_anterior && (
                      <>
                        <BadgeEstado estado={mov.estado_anterior} />
                        <span className="text-xs text-gray-400">→</span>
                      </>
                    )}
                    <BadgeEstado estado={mov.estado_nuevo} />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {mov.cliente && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <User size={12} className="text-gray-400" />
                      <span>{mov.cliente}</span>
                    </div>
                  )}
                  {mov.orden_bondarea && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Hash size={12} className="text-gray-400" />
                      <span>Orden: {mov.orden_bondarea}</span>
                    </div>
                  )}
                  {mov.cantidad_delta !== 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span
                        className={
                          mov.cantidad_delta > 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {mov.cantidad_delta > 0 ? '+' : ''}
                        {mov.cantidad_delta} unidades
                      </span>
                    </div>
                  )}
                </div>

                {mov.notas && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-gray-50 px-2.5 py-2">
                    <FileText size={12} className="mt-0.5 shrink-0 text-gray-400" />
                    <p className="text-xs text-gray-600">{mov.notas}</p>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
