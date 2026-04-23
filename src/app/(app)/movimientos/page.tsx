'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { HistorialTimeline } from '@/components/movimientos/HistorialTimeline'
import type { TipoMovimiento, Movimiento, Pago } from '@/types/producto'
import { MOVIMIENTO_LABELS } from '@/types/producto'
import { useMovimientos } from '@/hooks/useMovimientos'
import { RefreshCw, X, Edit, Check, MapPin, Phone, CreditCard, User, Package, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDatetime } from '@/lib/utils'

type TipoFiltro = TipoMovimiento | 'todos'

const TIPO_OPTIONS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos los movimientos' },
  { value: 'confirmacion_pago', label: MOVIMIENTO_LABELS.confirmacion_pago },
  { value: 'ingreso_stock', label: MOVIMIENTO_LABELS.ingreso_stock },
  { value: 'reserva', label: MOVIMIENTO_LABELS.reserva },
  { value: 'confirmacion_venta', label: MOVIMIENTO_LABELS.confirmacion_venta },
  { value: 'devolucion_stock', label: MOVIMIENTO_LABELS.devolucion_stock },
  { value: 'ajuste_cantidad', label: MOVIMIENTO_LABELS.ajuste_cantidad },
]

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

export default function MovimientosPage() {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [movSeleccionado, setMovSeleccionado] = useState<Movimiento | null>(null)
  const [pago, setPago] = useState<Pago | null>(null)
  const [loadingPago, setLoadingPago] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Pago>>({})
  const [saving, setSaving] = useState(false)

  const { movimientos, total, isLoading, mutate } = useMovimientos({
    tipoMovimiento: tipoFiltro,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  })

  async function abrirDetalle(mov: Movimiento) {
    setMovSeleccionado(mov)
    setPago(null)
    setEditando(false)
    setLoadingPago(true)
    try {
      // Find the pago by producto_id and date proximity
      const res = await fetch(`/api/pagos?producto_id=${mov.producto_id}&limit=10`)
      const json = await res.json()
      // Find pago closest to this movement
      const pagos: Pago[] = json.data ?? []
      const found = pagos.find((p) =>
        Math.abs(new Date(p.fecha_pago).getTime() - new Date(mov.created_at).getTime()) < 60000
      ) ?? pagos[0] ?? null
      setPago(found)
      if (found) setEditForm({
        cliente_nombre: found.cliente_nombre ?? '',
        cliente_apellido: found.cliente_apellido ?? '',
        cliente_telefono: found.cliente_telefono ?? '',
        cliente_direccion: found.cliente_direccion ?? '',
        metodo_pago: found.metodo_pago ?? 'efectivo',
        nota: found.nota ?? '',
      })
    } finally {
      setLoadingPago(false)
    }
  }

  async function handleGuardar() {
    if (!pago) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setPago(updated)
        setEditando(false)
      }
    } finally {
      setSaving(false)
    }
  }

  function cerrarDetalle() {
    setMovSeleccionado(null)
    setPago(null)
    setEditando(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Movimientos" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Tipo de movimiento</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
              className="flex h-9 appearance-none rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919]"
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="flex h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919]" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="flex h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#851919]" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {(tipoFiltro !== 'todos' || fechaDesde || fechaHasta) && (
              <Button variant="ghost" size="sm" onClick={() => { setTipoFiltro('todos'); setFechaDesde(''); setFechaHasta('') }}>
                Limpiar
              </Button>
            )}
            <Button variant="outline" size="icon-sm" onClick={() => mutate()}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500">{isLoading ? 'Cargando...' : `${total} movimientos`}</p>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 rounded-lg bg-gray-200" />)}
          </div>
        ) : (
          <HistorialTimeline
            movimientos={movimientos}
            onClickMovimiento={abrirDetalle}
          />
        )}
      </div>

      {/* Panel de detalle */}
      {movSeleccionado && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={cerrarDetalle} />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Detalle del pago</h2>
              <div className="flex items-center gap-2">
                {pago && !editando && (
                  <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                    <Edit size={14} /> Editar
                  </Button>
                )}
                {editando && (
                  <Button size="sm" variant="green" isLoading={saving} onClick={handleGuardar}>
                    <Check size={14} /> Guardar
                  </Button>
                )}
                <button onClick={cerrarDetalle} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingPago ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-200" />)}
                </div>
              ) : pago ? (
                <>
                  {/* Producto */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Package size={12} /> Producto
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {pago.producto?.tela?.codigo ?? '-'} · {pago.tipo_producto}
                    </p>
                    {pago.medida && <p className="text-xs text-gray-500">Medida: {pago.medida}</p>}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-600">Cantidad: <strong>{pago.cantidad}</strong></span>
                      <span className="text-sm font-bold text-[#851919]">
                        ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDatetime(pago.fecha_pago)}
                  </div>

                  {/* Método de pago */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <CreditCard size={12} /> Método de pago
                    </p>
                    {editando ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(['efectivo', 'transferencia', 'tarjeta'] as const).map((m) => (
                          <button key={m} type="button"
                            onClick={() => setEditForm((f) => ({ ...f, metodo_pago: m }))}
                            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                              editForm.metodo_pago === m
                                ? 'border-[#851919] bg-[#851919]/10 text-[#851919]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {METODO_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800">{METODO_LABELS[pago.metodo_pago ?? ''] ?? pago.metodo_pago ?? '-'}</p>
                    )}
                  </div>

                  {/* Datos del cliente */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <User size={12} /> Cliente
                    </p>
                    {editando ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'cliente_nombre', label: 'Nombre' },
                            { key: 'cliente_apellido', label: 'Apellido' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">{label}</label>
                              <input
                                value={(editForm as Record<string, string>)[key] ?? ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                className="h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> Teléfono</label>
                          <input
                            value={editForm.cliente_telefono ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, cliente_telefono: e.target.value }))}
                            className="h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> Dirección</label>
                          <input
                            value={editForm.cliente_direccion ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, cliente_direccion: e.target.value }))}
                            className="h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500">Nota</label>
                          <textarea
                            value={editForm.nota ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, nota: e.target.value }))}
                            rows={2}
                            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#851919]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {pago.cliente_nombre} {pago.cliente_apellido}
                        </p>
                        {pago.cliente_telefono && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone size={11} className="text-gray-400" /> {pago.cliente_telefono}
                          </p>
                        )}
                        {pago.cliente_direccion && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <MapPin size={11} className="text-gray-400" /> {pago.cliente_direccion}
                          </p>
                        )}
                        {pago.nota && (
                          <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-md px-2.5 py-2">{pago.nota}</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No se encontró el registro de pago.</p>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
