'use client'

import useSWR from 'swr'

export interface EstadoProductoConfig {
  id: string
  codigo: string
  nombre: string
  color: string
  badge_class: string
  es_terminal: boolean
  transiciones: string[]
  activo: boolean
  orden: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useEstadosProducto() {
  const { data, error, mutate } = useSWR<EstadoProductoConfig[]>(
    '/api/config/estados-producto',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  return {
    estados: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  }
}
