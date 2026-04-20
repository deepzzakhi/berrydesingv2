'use client'

import useSWR from 'swr'

export interface TipoProductoConfig {
  id: string
  codigo: string
  nombre: string
  requiere_medida: boolean
  activo: boolean
  orden: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useTiposProducto() {
  const { data, error, mutate } = useSWR<TipoProductoConfig[]>(
    '/api/config/tipos-producto',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  return {
    tipos: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  }
}
