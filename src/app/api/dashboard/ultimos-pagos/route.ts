import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoProducto } from '@/types/producto'
import { TIPO_LABELS } from '@/types/producto'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 100)

  let query = supabase
    .from('pagos')
    .select(`
      id,
      monto,
      fecha_pago,
      nota,
      tipo_producto,
      medida,
      producto:productos(tela:telas(codigo)),
      usuario:usuarios(nombre, email)
    `)
    .order('fecha_pago', { ascending: false })
    .limit(limit)

  if (fecha_desde) query = query.gte('fecha_pago', fecha_desde)
  if (fecha_hasta) {
    const hasta = new Date(fecha_hasta)
    hasta.setHours(23, 59, 59, 999)
    query = query.lte('fecha_pago', hasta.toISOString())
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al obtener últimos pagos' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (data ?? []).map((p: any) => ({
    id: p.id,
    fecha_pago: p.fecha_pago,
    codigo_tela: p.producto?.tela?.codigo ?? '-',
    tipo: p.tipo_producto,
    tipo_label: TIPO_LABELS[p.tipo_producto as TipoProducto] ?? p.tipo_producto,
    medida: p.medida,
    monto: Number(p.monto),
    nota: p.nota,
    usuario: p.usuario?.nombre ?? p.usuario?.email ?? 'Sistema',
  }))

  return NextResponse.json(result)
}
