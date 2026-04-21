'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'
import { useCarrito } from '@/context/CarritoContext'

interface AgregarAlCarritoModalProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgregarAlCarritoModal({
  producto,
  open,
  onOpenChange,
}: AgregarAlCarritoModalProps) {
  const { agregar, abrirPanel } = useCarrito()
  const [cantidad, setCantidad] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setCantidad(1)
      setError(null)
    }
  }, [open])

  if (!producto) return null

  const maxCantidad = producto.cantidad

  function handleCantidadChange(val: string) {
    setError(null)
    const n = parseInt(val, 10)
    if (isNaN(n)) { setCantidad(0); return }
    setCantidad(n)
  }

  function handleAgregar() {
    if (cantidad < 1) { setError('La cantidad debe ser al menos 1'); return }
    if (cantidad > maxCantidad) {
      setError(`Stock disponible: ${maxCantidad}`)
      return
    }
    agregar(producto!, cantidad)
    onOpenChange(false)
    abrirPanel()
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar a venta"
      description="Ingresá la cantidad a vender. El stock se descuenta al confirmar."
      size="sm"
    >
      {/* Producto info */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-0.5">
        <p className="text-sm font-semibold text-gray-900">
          {producto.tela?.codigo ?? '-'}
        </p>
        <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
        {producto.medida && (
          <p className="text-xs text-gray-400">Medida: {producto.medida}</p>
        )}
        <p className="text-xs text-gray-400">
          Stock disponible:{' '}
          <span className="font-semibold text-gray-700">{maxCantidad}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Cantidad a vender <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setError(null); setCantidad((c) => Math.max(1, c - 1)) }}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors select-none"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={maxCantidad}
              value={cantidad}
              onChange={(e) => handleCantidadChange(e.target.value)}
              className="flex h-10 w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => { setError(null); setCantidad((c) => Math.min(maxCantidad, c + 1)) }}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors select-none"
            >
              +
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="green"
            className="flex-1"
            onClick={handleAgregar}
            disabled={cantidad < 1 || cantidad > maxCantidad}
          >
            <ShoppingCart size={14} className="mr-1" />
            Agregar ({cantidad})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
