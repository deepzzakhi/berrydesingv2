import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Error al obtener datos del dashboard')
    return r.json()
  })

export interface DashboardStats {
  total_cobrado: number
  unidades_vendidas: number
  pagos_confirmados: number
  pagos_pendientes: number
  rubro_ganador: { tipo: string; total: number; porcentaje: number } | null
}

export interface VentaMensual {
  mes: string
  key: string
  total: number
}

export interface VentaRubro {
  rubro: string
  label: string
  total: number
  porcentaje: number
}

export interface TopProducto {
  codigo_tela: string
  tipo: string
  tipo_label: string
  unidades: number
  total_cobrado: number
  porcentaje: number
}

export interface UltimoPago {
  id: string
  fecha_pago: string
  codigo_tela: string
  tipo: string
  tipo_label: string
  medida: string | null
  monto: number
  nota: string | null
  usuario: string
}

interface PeriodoParams {
  fecha_desde?: string
  fecha_hasta?: string
}

function buildParams(periodo: PeriodoParams) {
  const p = new URLSearchParams()
  if (periodo.fecha_desde) p.set('fecha_desde', periodo.fecha_desde)
  if (periodo.fecha_hasta) p.set('fecha_hasta', periodo.fecha_hasta)
  return p.toString() ? `?${p}` : ''
}

export function useDashboardStats(periodo: PeriodoParams = {}) {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    `/api/dashboard/stats${buildParams(periodo)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  return { stats: data ?? null, error, isLoading, mutate }
}

export function useVentasMensuales(periodo: PeriodoParams = {}) {
  const { data, error, isLoading } = useSWR<VentaMensual[]>(
    `/api/dashboard/ventas-mensuales${buildParams(periodo)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  return { ventas: data ?? [], error, isLoading }
}

export function useVentasPorRubro(periodo: PeriodoParams = {}) {
  const { data, error, isLoading } = useSWR<VentaRubro[]>(
    `/api/dashboard/por-rubro${buildParams(periodo)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  return { rubros: data ?? [], error, isLoading }
}

export function useTopProductos(periodo: PeriodoParams = {}) {
  const { data, error, isLoading } = useSWR<TopProducto[]>(
    `/api/dashboard/top-productos${buildParams(periodo)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  return { topProductos: data ?? [], error, isLoading }
}

export function useUltimosPagos(periodo: PeriodoParams = {}) {
  const { data, error, isLoading } = useSWR<UltimoPago[]>(
    `/api/dashboard/ultimos-pagos${buildParams(periodo)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  return { ultimosPagos: data ?? [], error, isLoading }
}
