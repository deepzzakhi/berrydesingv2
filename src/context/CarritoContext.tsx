'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Producto } from '@/types/producto'

export interface CarritoItem {
  producto: Producto
  cantidad: number
}

interface CarritoContextType {
  items: CarritoItem[]
  panelAbierto: boolean
  agregar: (producto: Producto, cantidad: number) => void
  quitar: (productoId: string) => void
  limpiar: () => void
  abrirPanel: () => void
  cerrarPanel: () => void
  totalItems: number
}

const CarritoContext = createContext<CarritoContextType | null>(null)

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CarritoItem[]>([])
  const [panelAbierto, setPanelAbierto] = useState(false)

  const agregar = useCallback((producto: Producto, cantidad: number) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id)
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.cantidad) }
            : i
        )
      }
      return [...prev, { producto, cantidad }]
    })
  }, [])

  const quitar = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId))
  }, [])

  const limpiar = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)

  return (
    <CarritoContext.Provider
      value={{
        items,
        panelAbierto,
        agregar,
        quitar,
        limpiar,
        abrirPanel: () => setPanelAbierto(true),
        cerrarPanel: () => setPanelAbierto(false),
        totalItems,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito must be used inside CarritoProvider')
  return ctx
}
