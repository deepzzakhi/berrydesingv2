'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, LayoutGrid, List, Download, RefreshCw } from 'lucide-react'
import { useProductos } from '@/hooks/useProductos'
import { FiltrosInventario } from '@/components/inventario/FiltrosInventario'
import { StatsInventario } from '@/components/inventario/StatsInventario'
import { CardProducto } from '@/components/inventario/CardProducto'
import { TablaProductos } from '@/components/inventario/TablaProductos'
import { FormMovimiento } from '@/components/movimientos/FormMovimiento'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import type { Producto, FiltrosInventario as FiltrosType } from '@/types/producto'

type Accion = 'reservar' | 'vender' | 'devolver'

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
        <div className="h-8 w-full rounded bg-gray-100" />
      </div>
    </div>
  )
}

export default function InventarioPage() {
  const [filtros, setFiltros] = useState<FiltrosType>({})
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [accion, setAccion] = useState<Accion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { productos, isLoading, mutate } = useProductos(filtros)

  const stats = useMemo(() => {
    return {
      total: productos.length,
      stock: productos.filter((p) => p.estado === 'stock').length,
      reservado: productos.filter((p) => p.estado === 'reservado').length,
      vendido: productos.filter((p) => p.estado === 'vendido').length,
    }
  }, [productos])

  function abrirModal(producto: Producto, accionTipo: Accion) {
    setProductoSeleccionado(producto)
    setAccion(accionTipo)
    setModalOpen(true)
  }

  function handleSuccess() {
    mutate()
  }

  async function handleExportar() {
    const res = await fetch('/api/exportar')
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `berry-stock-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Inventario" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm text-gray-500">
              {isLoading ? 'Cargando...' : `${productos.length} productos encontrados`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportar}>
              <Download size={15} />
              Exportar Excel
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => mutate()} title="Actualizar">
              <RefreshCw size={15} />
            </Button>
            {/* Vista toggle */}
            <div className="flex items-center rounded-lg border border-gray-300 bg-white p-0.5">
              <button
                onClick={() => setVista('grid')}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  vista === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setVista('tabla')}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  vista === 'tabla' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={15} />
              </button>
            </div>
            <Link href="/productos/nuevo">
              <Button size="sm">
                <Plus size={16} />
                Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <StatsInventario stats={stats} />

        {/* Filters */}
        <FiltrosInventario onFiltrosChange={setFiltros} />

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <p className="text-base font-medium text-gray-500">No se encontraron productos</p>
            <p className="mt-1 text-sm text-gray-400">
              Probá ajustando los filtros o{' '}
              <Link href="/productos/nuevo" className="text-[#853f9a] hover:underline">
                creá un producto nuevo
              </Link>
            </p>
          </div>
        ) : vista === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {productos.map((producto) => (
              <CardProducto
                key={producto.id}
                producto={producto}
                onReservar={(p) => abrirModal(p, 'reservar')}
                onVender={(p) => abrirModal(p, 'vender')}
                onDevolver={(p) => abrirModal(p, 'devolver')}
              />
            ))}
          </div>
        ) : (
          <TablaProductos
            productos={productos}
            onReservar={(p) => abrirModal(p, 'reservar')}
            onVender={(p) => abrirModal(p, 'vender')}
            onDevolver={(p) => abrirModal(p, 'devolver')}
          />
        )}
      </div>

      {/* Movement modal */}
      <FormMovimiento
        producto={productoSeleccionado}
        accion={accion}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
