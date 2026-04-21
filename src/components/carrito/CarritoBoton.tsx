'use client'

import { ShoppingCart } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'

export function CarritoBoton() {
  const { totalItems, abrirPanel } = useCarrito()

  if (totalItems === 0) return null

  return (
    <button
      onClick={abrirPanel}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#851919] px-4 py-3 text-white shadow-lg hover:bg-[#6b1414] transition-colors"
    >
      <ShoppingCart size={18} />
      <span className="text-sm font-semibold">Ver venta</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#851919]">
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </button>
  )
}
