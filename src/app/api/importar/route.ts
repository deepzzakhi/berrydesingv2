import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProducto } from '@/lib/db/productos'
import type { FilaBondarea } from '@/lib/bondarea/parser'
import type { TipoProducto } from '@/types/producto'
import { z } from 'zod'

const importarSchema = z.object({
  filas: z.array(
    z.object({
      orden_bondarea: z.string(),
      cliente: z.string(),
      codigo_tela: z.string(),
      tipo: z.string(),
      medida: z.string().nullable(),
      cantidad: z.number(),
      notas: z.string().nullable(),
    })
  ).min(1, 'Debe haber al menos una fila para importar'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = importarSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }

    const { filas } = parsed.data
    let importados = 0
    const errores: Array<{ fila: number; error: string }> = []

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i] as FilaBondarea

      try {
        // Ensure product exists (creates tela if needed)
        const producto = await createProducto({
          codigo_tela: fila.codigo_tela,
          tipo: fila.tipo as TipoProducto,
          medida: fila.medida,
          cantidad: 0,
        }).catch(async () => {
          // If product already exists, fetch it
          const { data } = await supabase
            .from('productos')
            .select('*, tela:telas(codigo)')
            .eq('tipo', fila.tipo)
            .eq('medida', fila.medida ?? '')
            .then(async (result) => {
              // Find by tela codigo + tipo + medida
              const { data: telaData } = await supabase
                .from('telas')
                .select('id')
                .eq('codigo', fila.codigo_tela)
                .single()

              if (!telaData) return { data: null }

              return supabase
                .from('productos')
                .select('*')
                .eq('tela_id', telaData.id)
                .eq('tipo', fila.tipo)
                .maybeSingle()
            })
          return data
        })

        if (!producto) {
          errores.push({ fila: i + 1, error: 'No se pudo encontrar o crear el producto' })
          continue
        }

        // Register reservation movement via RPC
        const { error: movErr } = await supabase.rpc('registrar_movimiento', {
          p_producto_id: producto.id,
          p_tipo_movimiento: 'reserva',
          p_cantidad_delta: fila.cantidad,
          p_orden_bondarea: fila.orden_bondarea || null,
          p_cliente: fila.cliente || null,
          p_usuario_id: user.id,
          p_notas: fila.notas || null,
        })

        if (movErr) {
          errores.push({ fila: i + 1, error: movErr.message })
          continue
        }

        importados++
      } catch (err) {
        errores.push({
          fila: i + 1,
          error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    return NextResponse.json({
      importados,
      errores: errores.length,
      detallesErrores: errores,
      total: filas.length,
    })
  } catch (error) {
    console.error('[POST /api/importar]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
