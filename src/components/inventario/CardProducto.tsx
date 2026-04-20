'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Coffee, Glasses, Droplets, Layers } from 'lucide-react'
import type { Producto, TipoProducto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'
import { BadgeEstado } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface CardProductoProps {
  producto: Producto
  onReservar?: (producto: Producto) => void
  onVender?: (producto: Producto) => void
  onDevolver?: (producto: Producto) => void
}

const TIPO_ICONS: Record<TipoProducto, React.ElementType> = {
  matera: Coffee,
  porta_anteojos: Glasses,
  cubre_bidon: Droplets,
  alfombra_vinilica: Layers,
}

export function CardProducto({ producto, onReservar, onVender, onDevolver }: CardProductoProps) {
  const Icon = TIPO_ICONS[producto.tipo] ?? ShoppingBag
  const codigoTela = producto.tela?.codigo ?? '-'

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image / Placeholder */}
      <Link href={`/inventario/${producto.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {producto.tela?.foto_url ? (
            <Image
              src={producto.tela.foto_url}
              alt={`Tela ${codigoTela}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon size={48} className="text-gray-300" />
            </div>
          )}

          {/* Estado badge overlay */}
          <div className="absolute top-2 right-2">
            <BadgeEstado estado={producto.estado} />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <Link href={`/inventario/${producto.id}`} className="block space-y-0.5">
          <p className="text-base font-bold text-gray-900 tracking-wide">{codigoTela}</p>
          <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
          {producto.tipo === 'alfombra_vinilica' && producto.medida && (
            <p className="text-xs text-gray-400">Medida: {producto.medida}</p>
          )}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Cantidad</p>
            <p
              className={cn(
                'text-lg font-bold leading-tight',
                producto.cantidad > 0 ? 'text-gray-900' : 'text-red-500'
              )}
            >
              {producto.cantidad}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-1">
          {producto.estado === 'stock' && (
            <>
              <Button
                size="sm"
                variant="amber"
                className="flex-1 text-xs"
                onClick={() => onReservar?.(producto)}
              >
                Reservar
              </Button>
              <Button
                size="sm"
                variant="green"
                className="flex-1 text-xs"
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
                className="flex-1 text-xs"
                onClick={() => onVender?.(producto)}
              >
                Confirmar venta
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
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
              className="flex-1 text-xs"
              onClick={() => onDevolver?.(producto)}
            >
              Devolver a stock
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
