'use client'

import { useState } from 'react'
import { X, Trash2, ShoppingCart, CheckCircle, AlertCircle, ArrowLeft, Package } from 'lucide-react'
import Image from 'next/image'
import { useCarrito } from '@/context/CarritoContext'
import { Button } from '@/components/ui/Button'
import { TIPO_LABELS } from '@/types/producto'

interface CarritoPanelProps {
  onConfirmado?: () => void
}

type Paso = 'carrito' | 'datos' | 'resumen'
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta'

const METODO_LABELS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

const INITIAL_CLIENTE = {
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
  metodo_pago: 'efectivo' as MetodoPago,
  notas: '',
}

export function CarritoPanel({ onConfirmado }: CarritoPanelProps) {
  const { items, quitar, limpiar, cerrarPanel, panelAbierto } = useCarrito()

  const [paso, setPaso] = useState<Paso>('carrito')
  const [cliente, setCliente] = useState(INITIAL_CLIENTE)
  const [errores, setErrores] = useState<Partial<typeof INITIAL_CLIENTE>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<{
    exitosos: number
    fallidos: { producto_id: string; error: string }[]
  } | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  // Snapshot para mostrar en el resumen después de limpiar el carrito
  const [snapshot, setSnapshot] = useState<{ items: typeof items; totalUnidades: number; totalMonto: number } | null>(null)

  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0)
  const totalMonto = items.reduce((s, i) => s + i.monto, 0)

  function handleCerrar() {
    setResultado(null)
    setErrorGeneral(null)
    setPaso('carrito')
    setCliente(INITIAL_CLIENTE)
    setErrores({})
    setSnapshot(null)
    cerrarPanel()
  }

  function validarCliente() {
    const e: Partial<typeof INITIAL_CLIENTE> = {}
    if (!cliente.nombre.trim()) e.nombre = 'Requerido'
    if (!cliente.apellido.trim()) e.apellido = 'Requerido'
    if (!cliente.telefono.trim()) e.telefono = 'Requerido'
    if (!cliente.direccion.trim()) e.direccion = 'Requerida'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function handleConfirmar() {
    if (!validarCliente()) return
    setIsLoading(true)
    setErrorGeneral(null)

    // Guardar snapshot antes de que se limpie el carrito
    setSnapshot({ items: [...items], totalUnidades, totalMonto })

    try {
      const res = await fetch('/api/carrito/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            producto_id: i.producto.id,
            cantidad: i.cantidad,
            monto: i.monto,
          })),
          cliente: {
            nombre: cliente.nombre.trim(),
            apellido: cliente.apellido.trim(),
            telefono: cliente.telefono.trim(),
            direccion: cliente.direccion.trim(),
            metodo_pago: cliente.metodo_pago,
          },
          notas: cliente.notas.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok && res.status !== 207) {
        throw new Error(data.error ?? 'Error al confirmar la venta')
      }

      setResultado({ exitosos: data.exitosos, fallidos: data.fallidos ?? [] })

      const failedIds = new Set((data.fallidos ?? []).map((f: { producto_id: string }) => f.producto_id))
      items.forEach((item) => {
        if (!failedIds.has(item.producto.id)) quitar(item.producto.id)
      })

      window.dispatchEvent(new CustomEvent('carrito:confirmado'))
      onConfirmado?.()
      setPaso('resumen')
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  function campo(
    key: keyof typeof INITIAL_CLIENTE,
    label: string,
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-700">
          {label} {key !== 'notas' && <span className="text-red-500">*</span>}
        </label>
        <input
          {...props}
          value={cliente[key]}
          onChange={(e) => {
            setCliente((c) => ({ ...c, [key]: e.target.value }))
            setErrores((e2) => ({ ...e2, [key]: undefined }))
          }}
          className={`h-9 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919] ${
            errores[key] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errores[key] && <p className="text-xs text-red-600">{errores[key]}</p>}
      </div>
    )
  }

  return (
    <>
      {panelAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={handleCerrar}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          panelAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            {paso === 'datos' && (
              <button
                onClick={() => setPaso('carrito')}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-1"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <ShoppingCart size={18} className="text-[#851919]" />
            <h2 className="text-base font-semibold text-gray-900">
              {paso === 'carrito' && 'Carrito de venta'}
              {paso === 'datos' && 'Datos del cliente'}
              {paso === 'resumen' && 'Pedido confirmado'}
            </h2>
            {paso === 'carrito' && items.length > 0 && (
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

        {/* ── PASO 1: CARRITO ─────────────────────────────────────── */}
        {paso === 'carrito' && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCart size={40} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">El carrito está vacío</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Hacé clic en "Vender" en un producto para agregarlo
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map(({ producto, cantidad, monto }) => (
                    <li
                      key={producto.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                    >
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
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">—</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {producto.tela?.codigo ?? '-'}
                        </p>
                        <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">x{cantidad}</p>
                          <p className="text-xs font-semibold text-[#851919]">
                            ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
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

            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {items.length} producto{items.length !== 1 ? 's' : ''} · {totalUnidades} ud{totalUnidades !== 1 ? 's' : ''}
                  </span>
                  <button onClick={limpiar} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Limpiar todo
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-base font-bold text-[#851919]">
                    ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button variant="green" className="w-full" onClick={() => setPaso('datos')}>
                  Finalizar compra →
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── PASO 2: DATOS DEL CLIENTE ────────────────────────────── */}
        {paso === 'datos' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {errorGeneral && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{errorGeneral}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {campo('nombre', 'Nombre', { placeholder: 'María' })}
                {campo('apellido', 'Apellido', { placeholder: 'García' })}
              </div>
              {campo('telefono', 'Teléfono', { placeholder: '+54 9 11 1234-5678', type: 'tel' })}
              {campo('direccion', 'Dirección de entrega', { placeholder: 'Av. Corrientes 1234, CABA' })}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">
                  Método de pago <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['efectivo', 'transferencia', 'tarjeta'] as MetodoPago[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCliente((c) => ({ ...c, metodo_pago: m }))}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        cliente.metodo_pago === m
                          ? 'border-[#851919] bg-[#851919]/10 text-[#851919]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {METODO_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Notas (opcional)</label>
                <textarea
                  value={cliente.notas}
                  onChange={(e) => setCliente((c) => ({ ...c, notas: e.target.value }))}
                  placeholder="Instrucciones de entrega, horario, etc."
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#851919] resize-none"
                />
              </div>

              {/* Mini resumen */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Resumen del pedido</p>
                {items.map(({ producto, cantidad, monto }) => (
                  <div key={producto.id} className="flex justify-between text-xs text-gray-700">
                    <span>{producto.tela?.codigo} · {TIPO_LABELS[producto.tipo]} x{cantidad}</span>
                    <span className="font-medium">${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                  <span>Total</span>
                  <span>${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <Button variant="green" className="w-full" isLoading={isLoading} onClick={handleConfirmar}>
                <CheckCircle size={15} className="mr-1.5" />
                Confirmar pedido
              </Button>
            </div>
          </>
        )}

        {/* ── PASO 3: RESUMEN FINAL ────────────────────────────────── */}
        {paso === 'resumen' && resultado && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className={`rounded-xl border p-4 text-center ${
              resultado.fallidos.length === 0
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            }`}>
              {resultado.fallidos.length === 0 ? (
                <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
              ) : (
                <AlertCircle size={36} className="text-amber-500 mx-auto mb-2" />
              )}
              <p className="text-base font-bold text-gray-900">
                {resultado.fallidos.length === 0
                  ? '¡Pedido confirmado!'
                  : `${resultado.exitosos} de ${snapshot?.items.length ?? resultado.exitosos} productos procesados`}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {resultado.exitosos} producto{resultado.exitosos !== 1 ? 's' : ''} vendido{resultado.exitosos !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Datos del cliente */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-semibold text-gray-900">{cliente.nombre} {cliente.apellido}</p>
              <p className="text-xs text-gray-600">📞 {cliente.telefono}</p>
              <p className="text-xs text-gray-600">📍 {cliente.direccion}</p>
              <p className="text-xs text-gray-600">💳 {METODO_LABELS[cliente.metodo_pago]}</p>
            </div>

            {/* Productos del pedido */}
            {snapshot && snapshot.items.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</p>
                {snapshot.items.map(({ producto, cantidad, monto }) => (
                  <div key={producto.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      {producto.tela?.foto_url ? (
                        <Image src={producto.tela.foto_url} alt={producto.tela.codigo ?? ''} width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{producto.tela?.codigo} · {TIPO_LABELS[producto.tipo]}</p>
                      <p className="text-xs text-gray-500">x{cantidad} unidad{cantidad !== 1 ? 'es' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700">
                  {snapshot?.totalUnidades ?? 0} unidad{(snapshot?.totalUnidades ?? 0) !== 1 ? 'es' : ''}
                </span>
              </div>
              <span className="text-lg font-bold text-[#851919]">
                ${(snapshot?.totalMonto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {resultado.fallidos.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Productos con error:</p>
                <ul className="space-y-1">
                  {resultado.fallidos.map((f) => (
                    <li key={f.producto_id} className="text-xs text-red-600">{f.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={handleCerrar}>
              Cerrar
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}
