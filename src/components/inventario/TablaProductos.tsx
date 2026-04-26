'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Producto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'
import { BadgeEstado } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Eye, MoreHorizontal } from 'lucide-react'

interface TablaProductosProps {
  productos: Producto[]
  onReservar?: (producto: Producto) => void
  onVender?: (producto: Producto) => void
  onDevolver?: (producto: Producto) => void
}

function TablaProductosBase({ productos, onReservar, onVender, onDevolver }: TablaProductosProps) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <p className="text-base font-medium text-gray-500">No se encontraron productos</p>
        <p className="mt-1 text-sm text-gray-400">Probá ajustando los filtros de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Foto', 'Código', 'Tipo', 'Medida', 'Cantidad', 'Precio', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productos.map((producto) => (
              <tr key={producto.id} className="group hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {producto.tela?.foto_url ? (
                      <Image src={producto.tela.foto_url} alt={producto.tela?.codigo ?? ''} width={48} height={48} className="h-full w-full object-cover" loading="lazy" sizes="48px" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><MoreHorizontal size={16} className="text-gray-300" /></div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/inventario/${producto.id}`} className="font-semibold text-gray-900 hover:text-[#851919] transition-colors">
                    {producto.tela?.codigo ?? '-'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{TIPO_LABELS[producto.tipo]}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{producto.medida ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={producto.cantidad > 0 ? 'font-semibold text-gray-900' : 'font-semibold text-gray-400'}>
                    {producto.cantidad}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {producto.precio_unitario != null ? `$${producto.precio_unitario.toLocaleString('es-AR')}` : '-'}
                </td>
                <td className="px-4 py-3"><BadgeEstado estado={producto.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/inventario/${producto.id}`}>
                      <Button size="icon-sm" variant="ghost"><Eye size={15} /></Button>
                    </Link>
                    {producto.estado === 'stock' && (
                      <>
                        <Button size="sm" variant="amber" className="text-xs px-2 whitespace-nowrap" onClick={() => onReservar?.(producto)}>Reservar</Button>
                        <Button size="sm" variant="green" className="text-xs px-2 whitespace-nowrap" onClick={() => onVender?.(producto)} disabled={producto.cantidad === 0}>Vender</Button>
                      </>
                    )}
                    {producto.estado === 'reservado' && (
                      <>
                        <Button size="sm" variant="green" className="text-xs px-2 whitespace-nowrap" onClick={() => onVender?.(producto)}>Vender</Button>
                        <Button size="sm" variant="outline" className="text-xs px-2 whitespace-nowrap" onClick={() => onDevolver?.(producto)}>Devolver</Button>
                      </>
                    )}
                    {producto.estado === 'cobrado' && producto.cantidad > 0 && (
                      <Button size="sm" variant="green" className="text-xs px-2 whitespace-nowrap" onClick={() => onVender?.(producto)}>Vender</Button>
                    )}
                    {producto.estado === 'cobrado' && producto.cantidad === 0 && (
                      <span className="text-xs text-gray-400 px-2">Sin stock</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const TablaProductos = memo(TablaProductosBase)
