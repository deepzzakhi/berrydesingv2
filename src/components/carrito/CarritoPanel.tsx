'use client'

import { useState } from 'react'
import { X, Trash2, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useCarrito } from '@/context/CarritoContext'
import { Button } from '@/components/ui/Button'
import { TIPO_LABELS } from '@/types/producto'

interface CarritoPanelProps {
  onConfirmado?: () => void
}

export function CarritoPanel({ onConfirmado }: CarritoPanelProps) {
  const { items, quitar, limpiar, cerrarPanel, panelAbierto } = useCarrito()
  const [isLoading, setIsLoading] = useState(false)
  const [notas, setNotas] = useState('')
  const [resultado, setResultado] = useState<{
    exitosos: number
    fallidos: { producto_id: string; error: string }[]
  } | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  async function handleConfirmar() {
    if (items.length === 0) return
    setIsLoading(true)
    setErrorGeneral(null)
    setResultado(null)

    try {
      const res = await fetch('/api/carrito/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            producto_id: i.producto.id,
            cantidad: i.cantidad,
          })),
          notas: notas.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok && res.status !== 207) {
        throw new Error(data.error ?? 'Error al confirmar la venta')
      }

      setResultado({ exitosos: data.exitosos, fallidos: data.fallidos ?? [] })

      // Remove successful items from cart
      const failedIds = new Set((data.fallidos ?? []).map((f: { producto_id: string }) => f.producto_id))
      items.forEach((item) => {
        if (!failedIds.has(item.producto.id)) {
          quitar(item.producto.id)
        }
      })

      setNotas('')
      // Notify inventory page to revalidate
      window.dispatchEvent(new CustomEvent('carrito:confirmado'))
      onConfirmado?.()
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCerrar() {
    setResultado(null)
    setErrorGeneral(null)
    cerrarPanel()
  }

  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0)

  return (
    <>
      {/* Backdrop */}
      {panelAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={handleCerrar}
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          panelAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#851919]" />
            <h2 className="text-base font-semibold text-gray-900">Venta pendiente</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-[#851919] px-2 py-0.5 text-xs font-bold text-white">
                {totalUnidades}
              </span>
            )}
          </div>
          <button
            onClick={handleCerrar}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {resultado && (
            <div
              className={`mb-4 rounded-lg border p-3 ${
                resultado.fallidos.length === 0
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {resultado.fallidos.length === 0 ? (
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                )}
                <p className="text-sm font-medium text-gray-900">
                  {resultado.exitosos} producto{resultado.exitosos !== 1 ? 's' : ''} vendido{resultado.exitosos !== 1 ? 's' : ''}
                </p>
              </div>
              {resultado.fallidos.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {resultado.fallidos.map((f) => (
                    <li key={f.producto_id} className="text-xs text-amber-700">
                      {f.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {errorGeneral && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{errorGeneral}</p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No hay productos en la venta</p>
              <p className="text-xs text-gray-400 mt-1">
                Hacé clic en "Vender" en un producto para agregarlo
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(({ producto, cantidad }) => (
                <li
                  key={producto.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    {producto.tela?.foto_url ? (
                      <Image
                        src={producto.tela.foto_url}
                        alt={producto.tela.codigo ?? ''}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
                        —
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {producto.tela?.codigo ?? '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {TIPO_LABELS[producto.tipo]}
                    </p>
                    <p className="text-xs font-semibold text-[#851919]">
                      x{cantidad} unidad{cantidad !== 1 ? 'es' : ''}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => quitar(producto.id)}
                    className="shrink-0 rounded-md p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Quitar del carrito"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Resumen */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {items.length} producto{items.length !== 1 ? 's' : ''} —{' '}
                {totalUnidades} unidad{totalUnidades !== 1 ? 'es' : ''}
              </span>
              <button
                onClick={limpiar}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Limpiar todo
              </button>
            </div>

            {/* Notas opcionales */}
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas de la venta (opcional)"
              rows={2}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919] resize-none"
            />

            <Button
              variant="green"
              className="w-full"
              isLoading={isLoading}
              onClick={handleConfirmar}
            >
              <CheckCircle size={15} className="mr-1.5" />
              Confirmar venta ({totalUnidades} uds)
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}
