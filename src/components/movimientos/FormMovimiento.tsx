'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BadgeEstado } from '@/components/ui/Badge'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

type Accion = 'reservar' | 'vender' | 'devolver'

interface FormMovimientoProps {
  producto: Producto | null
  accion: Accion | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ACCION_CONFIG: Record<
  Accion,
  { title: string; description: string; tipoMovimiento: string; submitLabel: string; submitVariant: 'amber' | 'green' | 'outline' }
> = {
  reservar: {
    title: 'Reservar producto',
    description: 'Ingresá los datos del cliente para registrar la reserva.',
    tipoMovimiento: 'reserva',
    submitLabel: 'Confirmar reserva',
    submitVariant: 'amber',
  },
  vender: {
    title: 'Confirmar venta',
    description: 'Registrá la confirmación de venta del producto.',
    tipoMovimiento: 'confirmacion_venta',
    submitLabel: 'Confirmar venta',
    submitVariant: 'green',
  },
  devolver: {
    title: 'Devolver a stock',
    description: 'El producto volverá al estado "En stock".',
    tipoMovimiento: 'devolucion_stock',
    submitLabel: 'Devolver a stock',
    submitVariant: 'outline',
  },
}

export function FormMovimiento({
  producto,
  accion,
  open,
  onOpenChange,
  onSuccess,
}: FormMovimientoProps) {
  const [cliente, setCliente] = useState('')
  const [ordenBondarea, setOrdenBondarea] = useState('')
  const [notas, setNotas] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!producto || !accion) return null

  const config = ACCION_CONFIG[accion]
  const necesitaCliente = accion === 'reservar' || accion === 'vender'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (necesitaCliente && !cliente.trim()) {
      setError('El nombre del cliente es obligatorio')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: producto!.id,
          tipo_movimiento: config.tipoMovimiento,
          cliente: cliente.trim() || null,
          orden_bondarea: ordenBondarea.trim() || null,
          notas: notas.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al registrar el movimiento')
      }

      // Reset form
      setCliente('')
      setOrdenBondarea('')
      setNotas('')
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
      setCliente('')
      setOrdenBondarea('')
      setNotas('')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={config.title}
      description={config.description}
      size="md"
    >
      {/* Product summary */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {producto.tela?.codigo ?? '-'}
            </p>
            <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
            {producto.medida && (
              <p className="text-xs text-gray-400">Medida: {producto.medida}</p>
            )}
          </div>
          <BadgeEstado estado={producto.estado} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {necesitaCliente && (
          <Input
            label="Cliente"
            required
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
            disabled={isLoading}
          />
        )}

        {(accion === 'reservar' || accion === 'vender') && (
          <Input
            label="Orden Bondarea (opcional)"
            value={ordenBondarea}
            onChange={(e) => setOrdenBondarea(e.target.value)}
            placeholder="Número de orden"
            disabled={isLoading}
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales..."
            rows={3}
            disabled={isLoading}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#853f9a] focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-50 transition-colors resize-none"
          />
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
            variant={config.submitVariant}
            className="flex-1"
            isLoading={isLoading}
          >
            {config.submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
