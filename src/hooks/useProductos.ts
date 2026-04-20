import useSWR from 'swr'
import type { Producto, FiltrosInventario } from '@/types/producto'

const fetcher = async (url: string): Promise<Producto[]> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al obtener los productos')
  }
  return res.json()
}

export function useProductos(filtros?: FiltrosInventario) {
  const params = new URLSearchParams()

  if (filtros?.busqueda) params.set('busqueda', filtros.busqueda)
  if (filtros?.estado && filtros.estado !== 'todos') params.set('estado', filtros.estado)
  if (filtros?.tipo && filtros.tipo !== 'todos') params.set('tipo', filtros.tipo)

  const queryString = params.toString()
  const url = `/api/productos${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<Producto[]>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    productos: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
