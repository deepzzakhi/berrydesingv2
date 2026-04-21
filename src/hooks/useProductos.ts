import useSWRInfinite from 'swr/infinite'
import type { Producto, FiltrosInventario } from '@/types/producto'

const PAGE_SIZE = 50

interface ProductosPage {
  data: Producto[]
  total: number
  hasMore: boolean
}

const fetcher = async (url: string): Promise<ProductosPage> => {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error al obtener los productos')
  }
  return res.json()
}

export function useProductos(filtros?: FiltrosInventario) {
  const getKey = (pageIndex: number, previousPageData: ProductosPage | null) => {
    if (previousPageData && !previousPageData.hasMore) return null

    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(pageIndex * PAGE_SIZE))
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda)
    if (filtros?.estado && filtros.estado !== 'todos') params.set('estado', filtros.estado)
    if (filtros?.tipo && filtros.tipo !== 'todos') params.set('tipo', filtros.tipo)

    return `/api/productos?${params}`
  }

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<ProductosPage>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2_000,
    }
  )

  const productos = data ? data.flatMap((page) => page.data) : []
  const total = data?.[0]?.total ?? 0
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false
  const isLoadingMore = size > 1 && !!data && typeof data[size - 1] === 'undefined'

  return {
    productos,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    mutate,
    loadMore: () => setSize((s) => s + 1),
  }
}
