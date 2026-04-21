import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  let query = supabase.from('pagos').select('monto, fecha_pago')
  if (fecha_desde) query = query.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    query = query.lte('fecha_pago', hasta.toISOString())
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al obtener ventas mensuales' }, { status: 500 })
  }

  // Group by year-month
  const byMonth: Record<string, { label: string; total: number }> = {}
  for (const pago of data ?? []) {
    const d = new Date(pago.fecha_pago)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) {
      byMonth[key] = { label: `${MESES[d.getMonth()]} ${d.getFullYear()}`, total: 0 }
    }
    byMonth[key].total += Number(pago.monto)
  }

  const result = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, { label, total }]) => ({ mes: label, key: mes, total: Math.round(total * 100) / 100 }))

  return NextResponse.json(result)
}
