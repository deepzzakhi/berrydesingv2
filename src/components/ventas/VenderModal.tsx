'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

interface VenderModalProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

export function VenderModal({ producto, open, onOpenChange, onSuccess }: VenderModalProps) {
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState('')
  const [fechaPago, setFechaPago] = useState(hoy())
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (open && producto) {
      setCantidad(1)
      setPrecio(producto.precio_unitario != null ? String(producto.precio_unitario) : '')
      setFechaPago(hoy())
      setNombre('')
      setApellido('')
      setDni('')
      setEmail('')
      setNotas('')
      setError(null)
    }
  }, [open, producto])

  if (!producto) return null

  const maxCantidad = producto.cantidad > 0 ? producto.cantidad : 1
  const precioNum = parseFloat(precio) || 0
  const total = precioNum * cantidad

  function handleClose() {
    if (!isLoading) onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (!apellido.trim()) { setError('El apellido del cliente es obligatorio'); return }
    if (cantidad < 1 || cantidad > maxCantidad) {
      setError(`Cantidad inválida. Máximo disponible: ${maxCantidad}`)
      return
    }
    if (precioNum <= 0) { setError('El precio debe ser mayor a 0'); return }

    setIsLoading(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: producto.id,
          cantidad,
          monto: total,
          fecha_pago: new Date(fechaPago + 'T12:00:00').toISOString(),
          cliente_nombre: nombre.trim(),
          cliente_apellido: apellido.trim(),
          cliente_dni: dni.trim() || null,
          cliente_email: email.trim() || null,
          nota: notas.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error al registrar la venta')
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Registrar venta"
      size="md"
    >
      {/* Producto info */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{producto.tela?.codigo ?? '-'}</p>
          <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
          {producto.medida && <p className="text-xs text-gray-400">Medida: {producto.medida}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Stock</p>
          <p className="text-lg font-bold text-gray-900">{producto.cantidad}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Cantidad + precio en la misma fila */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="flex h-10 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-50 select-none"
              >−</button>
              <input
                type="number"
                min={1}
                max={maxCantidad}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Math.min(maxCantidad, parseInt(e.target.value) || 1)))}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919]"
              />
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(maxCantidad, c + 1))}
                className="flex h-10 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-50 select-none"
              >+</button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Precio unitario <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919]"
            />
          </div>
        </div>

        {/* Total calculado */}
        {total > 0 && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-green-700">Total de la venta</span>
            <span className="text-sm font-bold text-green-800">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Fecha de venta</label>
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#851919]"
          />
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Datos del cliente</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="María"
              disabled={isLoading}
            />
            <Input
              label="Apellido"
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="García"
              disabled={isLoading}
            />
            <Input
              label="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="12.345.678"
              disabled={isLoading}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@ejemplo.com"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones de la venta..."
            rows={2}
            maxLength={500}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919] resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="green" className="flex-1" isLoading={isLoading}>
            Confirmar venta
          </Button>
        </div>
      </form>
    </Modal>
  )
}
