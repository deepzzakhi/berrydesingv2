import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProductos } from '@/lib/db/productos'
import { exportarProductosExcel } from '@/lib/excel/exportar'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: productos } = await getProductos()
    const buffer = await exportarProductosExcel(productos)

    const fecha = new Date().toISOString().split('T')[0]
    const filename = `berry-stock-${fecha}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('[GET /api/exportar]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al exportar' },
      { status: 500 }
    )
  }
}
