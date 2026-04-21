import { createClient } from '@/lib/supabase/server'
import type {
  Producto,
  Tela,
  FiltrosInventario,
  CreateTelaInput,
  CreateProductoInput,
} from '@/types/producto'

export interface ProductosPaginados {
  data: Producto[]
  total: number
}

export async function getProductos(
  filtros?: FiltrosInventario,
  paginacion?: { limit: number; offset: number }
): Promise<ProductosPaginados> {
  const supabase = await createClient()

  let query = supabase
    .from('productos')
    .select(
      `
      *,
      tela:telas(
        *,
        catalogo:catalogos(*)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (filtros?.estado && filtros.estado !== 'todos') {
    query = query.eq('estado', filtros.estado)
  }

  if (filtros?.tipo && filtros.tipo !== 'todos') {
    query = query.eq('tipo', filtros.tipo)
  }

  if (filtros?.busqueda) {
    query = query.ilike('telas.codigo', `%${filtros.busqueda}%`)
  }

  if (paginacion) {
    const { limit, offset } = paginacion
    query = query.range(offset, offset + limit - 1)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error al obtener productos:', error)
    throw new Error('No se pudieron obtener los productos')
  }

  return {
    data: (data ?? []) as Producto[],
    total: count ?? 0,
  }
}

export async function getProducto(id: string): Promise<Producto | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('productos')
    .select(
      `
      *,
      tela:telas(
        *,
        catalogo:catalogos(*)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error al obtener producto:', error)
    throw new Error('No se pudo obtener el producto')
  }

  return data as Producto
}

export async function getTelaByCodigo(codigo: string): Promise<Tela | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('telas')
    .select('*, catalogo:catalogos(*)')
    .eq('codigo', codigo)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error('Error al buscar la tela')
  }

  return data as Tela
}

export async function createTela(input: CreateTelaInput): Promise<Tela> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('telas')
    .insert({
      codigo: input.codigo,
      foto_url: input.foto_url ?? null,
      observaciones: input.observaciones ?? null,
      catalogo_id: input.catalogo_id ?? null,
    })
    .select('*, catalogo:catalogos(*)')
    .single()

  if (error) {
    console.error('Error al crear tela:', error)
    if (error.code === '23505') {
      throw new Error(`Ya existe una tela con el código "${input.codigo}"`)
    }
    throw new Error('No se pudo crear la tela')
  }

  return data as Tela
}

export async function createProducto(input: CreateProductoInput): Promise<Producto> {
  const supabase = await createClient()

  // Find or create tela
  let tela = await getTelaByCodigo(input.codigo_tela)

  if (!tela) {
    tela = await createTela({
      codigo: input.codigo_tela,
      foto_url: input.foto_url,
      observaciones: input.observaciones,
      catalogo_id: input.catalogo_id,
    })
  } else if (input.foto_url || input.observaciones || input.catalogo_id) {
    // Update tela if new info is provided
    const updates: Partial<CreateTelaInput> = {}
    if (input.foto_url) updates.foto_url = input.foto_url
    if (input.observaciones) updates.observaciones = input.observaciones
    if (input.catalogo_id) updates.catalogo_id = input.catalogo_id

    const { data: updatedTela, error: updateError } = await supabase
      .from('telas')
      .update(updates)
      .eq('id', tela.id)
      .select('*, catalogo:catalogos(*)')
      .single()

    if (!updateError && updatedTela) {
      tela = updatedTela as Tela
    }
  }

  const { data, error } = await supabase
    .from('productos')
    .insert({
      tela_id: tela.id,
      tipo: input.tipo,
      medida: input.medida ?? null,
      cantidad: input.cantidad,
      estado: 'stock',
    })
    .select(
      `
      *,
      tela:telas(
        *,
        catalogo:catalogos(*)
      )
    `
    )
    .single()

  if (error) {
    console.error('Error al crear producto:', error)
    if (error.code === '23505') {
      throw new Error(
        `Ya existe un producto con código "${input.codigo_tela}", tipo "${input.tipo}" y medida "${input.medida ?? 'sin medida'}"`
      )
    }
    throw new Error('No se pudo crear el producto')
  }

  return data as Producto
}

export async function updateProducto(
  id: string,
  data: Partial<Pick<Producto, 'cantidad' | 'estado' | 'medida'>>
): Promise<Producto> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('productos')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(
      `
      *,
      tela:telas(
        *,
        catalogo:catalogos(*)
      )
    `
    )
    .single()

  if (error) {
    console.error('Error al actualizar producto:', error)
    throw new Error('No se pudo actualizar el producto')
  }

  return updated as Producto
}

export async function deleteProducto(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('productos').delete().eq('id', id)

  if (error) {
    console.error('Error al eliminar producto:', error)
    throw new Error('No se pudo eliminar el producto')
  }
}

export interface StatsInventario {
  total: number
  stock: number
  reservado: number
  vendido: number
}

export async function getStatsInventario(): Promise<StatsInventario> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('productos')
    .select('estado')

  if (error) {
    throw new Error('No se pudieron obtener las estadísticas')
  }

  const stats: StatsInventario = { total: 0, stock: 0, reservado: 0, vendido: 0 }

  for (const row of data ?? []) {
    stats.total++
    if (row.estado === 'stock') stats.stock++
    else if (row.estado === 'reservado') stats.reservado++
    else if (row.estado === 'cobrado') stats.vendido++
  }

  return stats
}
