'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { ArrowLeft, Edit, Package } from 'lucide-react'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'
import { BadgeEstado } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormMovimiento } from '@/components/movimientos/FormMovimiento'
import { VenderModal } from '@/components/ventas/VenderModal'
import { HistorialTimeline } from '@/components/movimientos/HistorialTimeline'
import { Topbar } from '@/components/layout/Topbar'
import { useMovimientos } from '@/hooks/useMovimientos'
import { formatDate } from '@/lib/utils'

type Accion = 'reservar' | 'devolver'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [accion, setAccion] = useState<Accion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [venderModalOpen, setVenderModalOpen] = useState(false)

  const { data: producto, isLoading, mutate } = useSWR<Producto>(
    id ? `/api/productos/${id}` : null,
    fetcher
  )

  const { movimientos, isLoading: movLoading, mutate: mutateMovimientos } = useMovimientos(id)

  function abrirModal(a: Accion) {
    setAccion(a)
    setModalOpen(true)
  }

  function handleSuccess() {
    mutate()
    mutateMovimientos()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Detalle de producto" />
        <div className="flex-1 p-6 animate-pulse space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Producto no encontrado" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <Package size={48} className="text-gray-300" />
          <p className="text-gray-500">No se encontró el producto</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Detalle de producto" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/inventario"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inventario
          </Link>
          <Link href={`/inventario/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit size={15} />
              Editar
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Photo + info */}
          <div className="space-y-4">
            {/* Photo */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 aspect-square">
              {producto.tela?.foto_url ? (
                <Image
                  src={producto.tela.foto_url}
                  alt={`Tela ${producto.tela.codigo}`}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package size={80} className="text-gray-200" />
                </div>
              )}
            </div>

            {/* Product details card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {producto.tela?.codigo ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{TIPO_LABELS[producto.tipo]}</p>
                </div>
                <BadgeEstado estado={producto.estado} />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-400">Cantidad</p>
                  <p className="text-xl font-bold text-gray-900">{producto.cantidad}</p>
                </div>
                {producto.medida && (
                  <div>
                    <p className="text-xs text-gray-400">Medida</p>
                    <p className="text-sm font-medium text-gray-700">{producto.medida}</p>
                  </div>
                )}
                {producto.tela?.catalogo && (
                  <div>
                    <p className="text-xs text-gray-400">Catálogo</p>
                    <p className="text-sm font-medium text-gray-700">
                      {producto.tela.catalogo.nombre}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Fecha de ingreso</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatDate(producto.created_at)}
                  </p>
                </div>
              </div>

              {producto.tela?.observaciones && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Observaciones</p>
                  <p className="text-sm text-gray-600 mt-0.5">{producto.tela.observaciones}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {producto.estado === 'stock' && (
                <>
                  <Button variant="amber" className="flex-1" onClick={() => abrirModal('reservar')}>
                    Reservar
                  </Button>
                  <Button variant="green" className="flex-1" onClick={() => setVenderModalOpen(true)} disabled={producto.cantidad === 0}>
                    Vender
                  </Button>
                </>
              )}
              {producto.estado === 'reservado' && (
                <>
                  <Button variant="green" className="flex-1" onClick={() => setVenderModalOpen(true)}>
                    Vender
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => abrirModal('devolver')}>
                    Devolver a stock
                  </Button>
                </>
              )}
              {producto.estado === 'cobrado' && producto.cantidad > 0 && (
                <Button variant="green" className="flex-1" onClick={() => setVenderModalOpen(true)}>
                  Vender
                </Button>
              )}
              {producto.estado === 'cobrado' && producto.cantidad === 0 && (
                <div className="flex-1 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 py-2 text-sm text-gray-500">
                  Sin stock
                </div>
              )}
            </div>
          </div>

          {/* Right: Timeline */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Historial de movimientos
            </h3>
            {movLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : (
              <HistorialTimeline movimientos={movimientos} />
            )}
          </div>
        </div>
      </div>

      <FormMovimiento
        producto={producto}
        accion={accion}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
      <VenderModal
        producto={producto}
        open={venderModalOpen}
        onOpenChange={setVenderModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
