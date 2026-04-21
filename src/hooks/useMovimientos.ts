import useSWR from 'swr'
import type { Movimiento } from '@/types/producto'

interface MovimientosPage {
  data: Movimiento[]
  total: number
  hasMore: boolean
}

const fetcher = async (url: string): Promise<MovimientosPage> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al obtener los movimientos')
  }
  return res.json()
}

interface UseMovimientosOpts {
  productoId?: string
  tipoMovimiento?: string
  fechaDesde?: string
  fechaHasta?: string
  limit?: number
}

export function useMovimientos(productoIdOrOpts?: string | UseMovimientosOpts) {
  // Accept either legacy string arg (productoId) or options object
  const opts: UseMovimientosOpts =
    typeof productoIdOrOpts === 'string'
      ? { productoId: productoIdOrOpts }
      : (productoIdOrOpts ?? {})

  const params = new URLSearchParams()
  params.set('limit', String(opts.limit ?? 100))
  params.set('offset', '0')
  if (opts.productoId) params.set('producto_id', opts.productoId)
  if (opts.tipoMovimiento && opts.tipoMovimiento !== 'todos')
    params.set('tipo_movimiento', opts.tipoMovimiento)
  if (opts.fechaDesde) params.set('fecha_desde', opts.fechaDesde)
  if (opts.fechaHasta) params.set('fecha_hasta', opts.fechaHasta)

  const url = `/api/movimientos?${params}`

  const { data, error, isLoading, mutate } = useSWR<MovimientosPage>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30_000,
  })

  return {
    movimientos: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  }
}
