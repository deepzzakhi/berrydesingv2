'use client'

import { useState } from 'react'

export type Periodo = 'mes' | 'anio' | 'todo' | 'personalizado'

export interface PeriodoFiltro {
  fecha_desde?: string
  fecha_hasta?: string
}

interface PeriodoSelectorProps {
  onChange: (filtro: PeriodoFiltro) => void
}

function getMesActual(): PeriodoFiltro {
  const now = new Date()
  const desde = new Date(now.getFullYear(), now.getMonth(), 1)
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    fecha_desde: desde.toISOString().split('T')[0],
    fecha_hasta: hasta.toISOString().split('T')[0],
  }
}

function getAnioActual(): PeriodoFiltro {
  const year = new Date().getFullYear()
  return {
    fecha_desde: `${year}-01-01`,
    fecha_hasta: `${year}-12-31`,
  }
}

export function PeriodoSelector({ onChange }: PeriodoSelectorProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  function handleSelect(p: Periodo) {
    setPeriodo(p)
    if (p === 'mes') onChange(getMesActual())
    else if (p === 'anio') onChange(getAnioActual())
    else if (p === 'todo') onChange({})
    // 'personalizado': wait for date inputs
  }

  function handleCustomApply() {
    if (desde && hasta) {
      onChange({ fecha_desde: desde, fecha_hasta: hasta })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
        {(['mes', 'anio', 'todo', 'personalizado'] as Periodo[]).map((p) => {
          const labels: Record<Periodo, string> = {
            mes: 'Este mes',
            anio: 'Este año',
            todo: 'Todo',
            personalizado: 'Personalizado',
          }
          return (
            <button
              key={p}
              onClick={() => handleSelect(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                periodo === p
                  ? 'bg-[#851919] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {labels[p]}
            </button>
          )
        })}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919]"
          />
          <span className="text-xs text-gray-400">hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919]"
          />
          <button
            onClick={handleCustomApply}
            disabled={!desde || !hasta}
            className="h-8 rounded-md bg-[#851919] px-3 text-xs font-medium text-white disabled:opacity-50 hover:bg-[#6b1414] transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
