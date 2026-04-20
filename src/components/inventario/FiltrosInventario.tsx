'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { FiltrosInventario as FiltrosType, EstadoProducto, TipoProducto } from '@/types/producto'

interface FiltrosInventarioProps {
  onFiltrosChange: (filtros: FiltrosType) => void
}

type EstadoFiltro = EstadoProducto | 'todos'
type TipoFiltro = TipoProducto | 'todos'

const ESTADO_CHIPS: { value: EstadoFiltro; label: string; activeClass: string }[] = [
  {
    value: 'todos',
    label: 'Todos',
    activeClass: 'bg-gray-900 text-white border-gray-900',
  },
  {
    value: 'stock',
    label: 'Stock',
    activeClass: 'bg-green-600 text-white border-green-600',
  },
  {
    value: 'reservado',
    label: 'Reservado',
    activeClass: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'vendido',
    label: 'Vendido',
    activeClass: 'bg-gray-400 text-white border-gray-400',
  },
]

const TIPO_OPTIONS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'matera', label: 'Matera' },
  { value: 'porta_anteojos', label: 'Porta anteojos' },
  { value: 'cubre_bidon', label: 'Cubre bidón' },
  { value: 'alfombra_vinilica', label: 'Alfombra vinílica' },
]

export function FiltrosInventario({ onFiltrosChange }: FiltrosInventarioProps) {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<EstadoFiltro>('todos')
  const [tipo, setTipo] = useState<TipoFiltro>('todos')

  function handleBusqueda(value: string) {
    setBusqueda(value)
    onFiltrosChange({ busqueda: value, estado, tipo })
  }

  function handleEstado(value: EstadoFiltro) {
    setEstado(value)
    onFiltrosChange({ busqueda, estado: value, tipo })
  }

  function handleTipo(value: TipoFiltro) {
    setTipo(value)
    onFiltrosChange({ busqueda, estado, tipo: value })
  }

  function limpiarFiltros() {
    setBusqueda('')
    setEstado('todos')
    setTipo('todos')
    onFiltrosChange({ busqueda: '', estado: 'todos', tipo: 'todos' })
  }

  const hayFiltros = busqueda || estado !== 'todos' || tipo !== 'todos'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            placeholder="Buscar por código de tela..."
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#853f9a] focus:border-transparent transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => handleBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tipo filter */}
        <div className="relative sm:w-52">
          <select
            value={tipo}
            onChange={(e) => handleTipo(e.target.value as TipoFiltro)}
            className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#853f9a] focus:border-transparent transition-colors"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Estado chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Estado:</span>
        {ESTADO_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => handleEstado(chip.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              estado === chip.value
                ? chip.activeClass
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            {chip.label}
          </button>
        ))}

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="ml-auto flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={10} />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
