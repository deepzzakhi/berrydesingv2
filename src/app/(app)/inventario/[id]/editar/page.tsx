'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { useTiposProducto } from '@/hooks/useTiposProducto'
import type { Producto } from '@/types/producto'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: producto, isLoading } = useSWR<Producto>(
    id ? `/api/productos/${id}` : null,
    fetcher
  )
  const { tipos } = useTiposProducto()

  const [cantidad, setCantidad] = useState('')
  const [medida, setMedida] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (producto) {
      setCantidad(String(producto.cantidad))
      setMedida(producto.medida ?? '')
      setPrecioUnitario(producto.precio_unitario != null ? String(producto.precio_unitario) : '')
      setFotoUrl(producto.tela?.foto_url ?? '')
      setObservaciones(producto.tela?.observaciones ?? '')
    }
  }, [producto])

  const tipoSeleccionado = tipos.find((t) => t.codigo === producto?.tipo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: parseInt(cantidad, 10) || 0,
          medida: medida.trim() || null,
          precio_unitario: precioUnitario ? parseFloat(precioUnitario) : null,
        }),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Error al guardar')

      router.push(`/inventario/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Editar producto" />
        <div className="flex-1 p-6 animate-pulse space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Producto no encontrado" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">No se encontró el producto</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Editar producto" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al detalle
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            {/* Info no editable */}
            <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Código de tela</span>
                <span className="font-mono font-semibold text-gray-900">{producto.tela?.codigo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="text-gray-900">{tipoSeleccionado?.nombre ?? producto.tipo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estado</span>
                <span className="capitalize text-gray-900">{producto.estado}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Cantidad"
                type="number"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                helperText="Unidades actuales en stock"
              />

              <Input
                label="Precio unitario ($)"
                type="number"
                step="0.01"
                min="0"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                placeholder="Ej: 1500.00"
                helperText="Precio de venta por unidad (se usará al vender)"
              />

              {tipoSeleccionado?.requiere_medida && (
                <Input
                  label="Medida"
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  placeholder="Ej: 120x180cm"
                />
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" isLoading={isSaving}>
                  <Check size={16} />
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
