import useSWR from 'swr'
import type { Pago } from '@/types/producto'

interface PagosResponse {
  data: Pago[]
  total: number
  hasMore: boolean
}

interface UsePagosOpts {
  limit?: number
  offset?: number
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: string
}

const fetcher = async (url: string): Promise<PagosResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al obtener los pagos')
  }
  return res.json()
}

export function usePagos(opts: UsePagosOpts = {}) {
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.offset) params.set('offset', String(opts.offset))
  if (opts.fecha_desde) params.set('fecha_desde', opts.fecha_desde)
  if (opts.fecha_hasta) params.set('fecha_hasta', opts.fecha_hasta)
  if (opts.usuario_id) params.set('usuario_id', opts.usuario_id)

  const key = `/api/pagos?${params}`

  const { data, error, isLoading, mutate } = useSWR<PagosResponse>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5_000,
  })

  return {
    pagos: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    error,
    mutate,
  }
}
