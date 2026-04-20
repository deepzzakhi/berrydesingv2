// ─── Enums / Literal Types ────────────────────────────────────────────────────

export type EstadoProducto = 'stock' | 'reservado' | 'vendido'

export type TipoProducto =
  | 'matera'
  | 'porta_anteojos'
  | 'cubre_bidon'
  | 'alfombra_vinilica'

export type TipoMovimiento =
  | 'ingreso_stock'
  | 'reserva'
  | 'confirmacion_venta'
  | 'devolucion_stock'
  | 'ajuste_cantidad'

export type RolUsuario = 'admin' | 'operador' | 'consulta'

// ─── DB Entities ──────────────────────────────────────────────────────────────

export interface Catalogo {
  id: string
  nombre: string
  temporada: string | null
  descripcion: string | null
  created_at: string
}

export interface Tela {
  id: string
  codigo: string
  foto_url: string | null
  observaciones: string | null
  catalogo_id: string | null
  catalogo?: Catalogo | null
  created_at: string
  updated_at: string
}

export interface Producto {
  id: string
  tela_id: string
  tela?: Tela
  tipo: TipoProducto
  medida: string | null
  cantidad: number
  estado: EstadoProducto
  created_at: string
  updated_at: string
}

export interface Movimiento {
  id: string
  producto_id: string
  producto?: Producto
  tipo_movimiento: TipoMovimiento
  estado_anterior: EstadoProducto | null
  estado_nuevo: EstadoProducto
  cantidad_delta: number
  orden_bondarea: string | null
  cliente: string | null
  usuario_id: string | null
  usuario?: Usuario | null
  notas: string | null
  created_at: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string | null
  rol: RolUsuario
  activo: boolean
  created_at: string
  updated_at: string
}

// ─── Input / Form Types ───────────────────────────────────────────────────────

export interface CreateTelaInput {
  codigo: string
  foto_url?: string | null
  observaciones?: string | null
  catalogo_id?: string | null
}

export interface CreateProductoInput {
  codigo_tela: string
  tipo: TipoProducto
  medida?: string | null
  cantidad: number
  foto_url?: string | null
  observaciones?: string | null
  catalogo_id?: string | null
}

export interface RegistrarMovimientoInput {
  producto_id: string
  tipo_movimiento: TipoMovimiento
  cantidad_delta?: number
  orden_bondarea?: string | null
  cliente?: string | null
  notas?: string | null
}

export interface FiltrosInventario {
  busqueda?: string
  estado?: EstadoProducto | 'todos'
  tipo?: TipoProducto | 'todos'
}

// ─── Labels / Colors ──────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<TipoProducto, string> = {
  matera: 'Matera',
  porta_anteojos: 'Porta anteojos',
  cubre_bidon: 'Cubre bidón',
  alfombra_vinilica: 'Alfombra vinílica',
}

export const ESTADO_LABELS: Record<EstadoProducto, string> = {
  stock: 'En stock',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

export const MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ingreso_stock: 'Ingreso a stock',
  reserva: 'Reserva',
  confirmacion_venta: 'Confirmación de venta',
  devolucion_stock: 'Devolución a stock',
  ajuste_cantidad: 'Ajuste de cantidad',
}

export const ESTADO_COLORS: Record<EstadoProducto, string> = {
  stock: '#16a34a',
  reservado: '#ca8a04',
  vendido: '#6b7280',
}

export const ESTADO_BADGE_CLASSES: Record<EstadoProducto, string> = {
  stock: 'bg-green-100 text-green-800 border-green-200',
  reservado: 'bg-amber-100 text-amber-800 border-amber-200',
  vendido: 'bg-gray-100 text-gray-600 border-gray-200',
}
