'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

interface ConfirmarPagoModalProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function formatFechaHoy() {
  return new Date().toISOString().split('T')[0]
}

export function ConfirmarPagoModal({
  producto,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmarPagoModalProps) {
  const [monto, setMonto] = useState('')
  const [fechaPago, setFechaPago] = useState(formatFechaHoy())
  const [nota, setNota] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!producto) return null

  const montoSugerido = producto.precio_unitario
    ? String(producto.precio_unitario)
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const montoNum = parseFloat(monto)
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (montoNum > 999999.99) {
      setError('El monto no puede superar $999,999.99')
      return
    }
    if (!fechaPago) {
      setError('La fecha de pago es obligatoria')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: producto!.id,
          monto: montoNum,
          fecha_pago: new Date(fechaPago + 'T12:00:00').toISOString(),
          nota: nota.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al confirmar el pago')
      }

      setMonto('')
      setFechaPago(formatFechaHoy())
      setNota('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    if (!isLoading) {
      setMonto('')
      setFechaPago(formatFechaHoy())
      setNota('')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Confirmar pago"
      description="Registrá el monto cobrado para marcar el producto como cobrado."
      size="md"
    >
      {/* Producto info */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          {producto.tela?.codigo ?? '-'}
        </p>
        <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
        {producto.medida && (
          <p className="text-xs text-gray-400">Medida: {producto.medida}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Monto cobrado ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="999999.99"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={montoSugerido ? `Sugerido: $${montoSugerido}` : 'Ej: 1500.00'}
            disabled={isLoading}
            required
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
          />
          {montoSugerido && !monto && (
            <button
              type="button"
              className="self-start text-xs text-[#851919] hover:underline"
              onClick={() => setMonto(montoSugerido)}
            >
              Usar precio sugerido: ${montoSugerido}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Fecha de pago <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            disabled={isLoading}
            required
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nota (opcional)</label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Notas sobre el pago..."
            rows={3}
            maxLength={500}
            disabled={isLoading}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919] focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{nota.length}/500</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="green"
            className="flex-1"
            isLoading={isLoading}
          >
            Confirmar pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}
