'use client'

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

export function TablaProductos({
  productos,
  onReservar,
  onVender,
  onDevolver,
}: TablaProductosProps) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <p className="text-base font-medium text-gray-500">No se encontraron productos</p>
        <p className="mt-1 text-sm text-gray-400">
          Probá ajustando los filtros de búsqueda
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Foto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Medida
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productos.map((producto) => (
              <tr key={producto.id} className="group hover:bg-gray-50 transition-colors">
                {/* Foto */}
                <td className="px-4 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {producto.tela?.foto_url ? (
                      <Image
                        src={producto.tela.foto_url}
                        alt={producto.tela?.codigo ?? ''}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <MoreHorizontal size={16} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Código */}
                <td className="px-4 py-3">
                  <Link
                    href={`/inventario/${producto.id}`}
                    className="font-semibold text-gray-900 hover:text-[#853f9a] transition-colors"
                  >
                    {producto.tela?.codigo ?? '-'}
                  </Link>
                </td>

                {/* Tipo */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {TIPO_LABELS[producto.tipo]}
                </td>

                {/* Medida */}
                <td className="px-4 py-3 text-sm text-gray-500">
                  {producto.medida ?? '-'}
                </td>

                {/* Cantidad */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={
                      producto.cantidad > 0
                        ? 'font-semibold text-gray-900'
                        : 'font-semibold text-red-500'
                    }
                  >
                    {producto.cantidad}
                  </span>
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <BadgeEstado estado={producto.estado} />
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/inventario/${producto.id}`}>
                      <Button size="icon-sm" variant="ghost">
                        <Eye size={15} />
                      </Button>
                    </Link>

                    {producto.estado === 'stock' && (
                      <>
                        <Button
                          size="sm"
                          variant="amber"
                          className="text-xs px-2"
                          onClick={() => onReservar?.(producto)}
                        >
                          Reservar
                        </Button>
                        <Button
                          size="sm"
                          variant="green"
                          className="text-xs px-2"
                          onClick={() => onVender?.(producto)}
                        >
                          Vender
                        </Button>
                      </>
                    )}

                    {producto.estado === 'reservado' && (
                      <>
                        <Button
                          size="sm"
                          variant="green"
                          className="text-xs px-2"
                          onClick={() => onVender?.(producto)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2"
                          onClick={() => onDevolver?.(producto)}
                        >
                          Devolver
                        </Button>
                      </>
                    )}

                    {producto.estado === 'vendido' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2"
                        onClick={() => onDevolver?.(producto)}
                      >
                        Devolver
                      </Button>
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
