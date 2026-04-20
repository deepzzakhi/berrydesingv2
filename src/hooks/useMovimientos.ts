import useSWR from 'swr'
import type { Movimiento } from '@/types/producto'

const fetcher = async (url: string): Promise<Movimiento[]> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al obtener los movimientos')
  }
  return res.json()
}

export function useMovimientos(productoId?: string) {
  const params = new URLSearchParams()
  if (productoId) params.set('producto_id', productoId)

  const queryString = params.toString()
  const url = `/api/movimientos${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<Movimiento[]>(url, fetcher, {
    revalidateOnFocus: true,
  })

  return {
    movimientos: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
