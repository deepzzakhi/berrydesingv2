'use client'

import { memo } from 'react'
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

function CardProductoBase({ producto, onReservar, onVender, onDevolver }: CardProductoProps) {
  const Icon = TIPO_ICONS[producto.tipo] ?? ShoppingBag
  const codigoTela = producto.tela?.codigo ?? '-'

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/inventario/${producto.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {producto.tela?.foto_url ? (
            <Image
              src={producto.tela.foto_url}
              alt={`Tela ${codigoTela}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon size={48} className="text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <BadgeEstado estado={producto.estado} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/inventario/${producto.id}`} className="block flex-1 space-y-0.5">
          <p className="text-base font-bold text-gray-900 tracking-wide">{codigoTela}</p>
          <p className="text-xs text-gray-500">{TIPO_LABELS[producto.tipo]}</p>
          {producto.medida && (
            <p className="text-xs text-gray-400">{producto.medida}</p>
          )}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">
              {producto.estado === 'cobrado' ? 'Sin stock' : 'Cantidad'}
            </p>
            <p className={cn('text-lg font-bold leading-tight', producto.cantidad > 0 ? 'text-gray-900' : 'text-gray-400')}>
              {producto.cantidad}
            </p>
          </div>
          {producto.precio_unitario != null && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Precio</p>
              <p className="text-sm font-semibold text-gray-700">
                ${producto.precio_unitario.toLocaleString('es-AR')}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 mt-auto">
          {producto.estado === 'stock' && (
            <>
              <Button size="sm" variant="amber" className="flex-1 text-xs" onClick={() => onReservar?.(producto)}>
                Reservar
              </Button>
              <Button size="sm" variant="green" className="flex-1 text-xs" onClick={() => onVender?.(producto)} disabled={producto.cantidad === 0}>
                Vender
              </Button>
            </>
          )}
          {producto.estado === 'reservado' && (
            <>
              <Button size="sm" variant="green" className="flex-1 text-xs" onClick={() => onVender?.(producto)}>
                Vender
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onDevolver?.(producto)}>
                Devolver
              </Button>
            </>
          )}
          {producto.estado === 'cobrado' && producto.cantidad > 0 && (
            <Button size="sm" variant="green" className="flex-1 text-xs" onClick={() => onVender?.(producto)}>
              Vender
            </Button>
          )}
          {producto.estado === 'cobrado' && producto.cantidad === 0 && (
            <div className="flex-1 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 py-1.5 text-xs text-gray-500">
              Sin stock
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const CardProducto = memo(CardProductoBase)
