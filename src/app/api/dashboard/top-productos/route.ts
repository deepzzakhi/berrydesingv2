import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoProducto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  let query = supabase
    .from('pagos')
    .select('monto, tipo_producto, producto:productos(tela:telas(codigo))')
  if (fecha_desde) query = query.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    query = query.lte('fecha_pago', hasta.toISOString())
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al obtener top productos' }, { status: 500 })
  }

  // Group by tela codigo + tipo
  const byProducto: Record<string, { codigo: string; tipo: string; unidades: number; total: number }> = {}
  for (const p of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const codigo = (p.producto as any)?.tela?.codigo ?? 'Sin código'
    const key = `${codigo}|${p.tipo_producto}`
    if (!byProducto[key]) {
      byProducto[key] = { codigo, tipo: p.tipo_producto, unidades: 0, total: 0 }
    }
    byProducto[key].unidades += 1
    byProducto[key].total += Number(p.monto)
  }

  const sorted = Object.values(byProducto)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const maxTotal = sorted[0]?.total ?? 1

  const result = sorted.map((item) => ({
    codigo_tela: item.codigo,
    tipo: item.tipo,
    tipo_label: TIPO_LABELS[item.tipo as TipoProducto] ?? item.tipo,
    unidades: item.unidades,
    total_cobrado: Math.round(item.total * 100) / 100,
    porcentaje: Math.round((item.total / maxTotal) * 100),
  }))

  return NextResponse.json(result)
}
