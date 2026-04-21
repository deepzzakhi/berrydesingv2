import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  // Build date filters
  let pagoQuery = supabase.from('pagos').select('monto, tipo_producto')
  if (fecha_desde) pagoQuery = pagoQuery.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    pagoQuery = pagoQuery.lte('fecha_pago', hasta.toISOString())
  }

  const { data: pagos, error: pagosError } = await pagoQuery
  if (pagosError) {
    console.error('dashboard/stats pagos error:', pagosError)
    return NextResponse.json({ error: 'Error al obtener stats' }, { status: 500 })
  }

  // Pending reservations (state = reservado, no time filter)
  const { count: pendientes } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'reservado')

  const total_cobrado = (pagos ?? []).reduce((sum, p) => sum + Number(p.monto), 0)
  const unidades_vendidas = (pagos ?? []).length
  const pagos_confirmados = unidades_vendidas
  const pagos_pendientes = pendientes ?? 0

  // Rubro ganador
  const porRubro: Record<string, number> = {}
  for (const p of pagos ?? []) {
    porRubro[p.tipo_producto] = (porRubro[p.tipo_producto] ?? 0) + Number(p.monto)
  }
  const rubroEntries = Object.entries(porRubro).sort((a, b) => b[1] - a[1])
  const rubro_ganador = rubroEntries[0]
    ? {
        tipo: rubroEntries[0][0],
        total: rubroEntries[0][1],
        porcentaje: total_cobrado > 0 ? Math.round((rubroEntries[0][1] / total_cobrado) * 100) : 0,
      }
    : null

  return NextResponse.json({
    total_cobrado,
    unidades_vendidas,
    pagos_confirmados,
    pagos_pendientes,
    rubro_ganador,
  })
}
