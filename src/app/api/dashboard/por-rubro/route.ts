import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoProducto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  let query = supabase.from('pagos').select('monto, tipo_producto')
  if (fecha_desde) query = query.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    query = query.lte('fecha_pago', hasta.toISOString())
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al obtener datos por rubro' }, { status: 500 })
  }

  const byRubro: Record<string, number> = {}
  let totalGeneral = 0
  for (const p of data ?? []) {
    byRubro[p.tipo_producto] = (byRubro[p.tipo_producto] ?? 0) + Number(p.monto)
    totalGeneral += Number(p.monto)
  }

  const result = Object.entries(byRubro)
    .sort(([, a], [, b]) => b - a)
    .map(([tipo, total]) => ({
      rubro: tipo,
      label: TIPO_LABELS[tipo as TipoProducto] ?? tipo,
      total: Math.round(total * 100) / 100,
      porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0,
    }))

  return NextResponse.json(result)
}
