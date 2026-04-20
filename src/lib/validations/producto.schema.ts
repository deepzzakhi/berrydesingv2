import { z } from 'zod'

export const tipoProductoEnum = z.enum([
  'matera',
  'porta_anteojos',
  'cubre_bidon',
  'alfombra_vinilica',
])

export const estadoProductoEnum = z.enum(['stock', 'reservado', 'vendido'])

export const tipoMovimientoEnum = z.enum([
  'ingreso_stock',
  'reserva',
  'confirmacion_venta',
  'devolucion_stock',
  'ajuste_cantidad',
])

export const createTelaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código de tela es obligatorio')
    .regex(/^\d{2}\/\d{4}$/, 'El código debe tener el formato NN/NNNN (ej: 27/0001)'),
  foto_url: z.string().url('La URL de la foto no es válida').nullable().optional(),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
  catalogo_id: z.string().uuid('ID de catálogo inválido').nullable().optional(),
})

export const createProductoSchema = z.object({
  codigo_tela: z
    .string()
    .min(1, 'El código de tela es obligatorio'),
  tipo: tipoProductoEnum,
  medida: z.string().nullable().optional(),
  cantidad: z
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa')
    .default(0),
  foto_url: z.string().url('URL de foto inválida').nullable().optional(),
  observaciones: z.string().max(500).nullable().optional(),
  catalogo_id: z.string().uuid().nullable().optional(),
})

export const registrarMovimientoSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  tipo_movimiento: tipoMovimientoEnum,
  cantidad_delta: z
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .int()
    .optional(),
  orden_bondarea: z.string().max(100).nullable().optional(),
  cliente: z.string().max(200).nullable().optional(),
  notas: z.string().max(1000).nullable().optional(),
})

export const filtrosInventarioSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.enum(['todos', 'stock', 'reservado', 'vendido']).optional(),
  tipo: z
    .enum(['todos', 'matera', 'porta_anteojos', 'cubre_bidon', 'alfombra_vinilica'])
    .optional(),
})

export type CreateTelaInput = z.infer<typeof createTelaSchema>
export type CreateProductoInput = z.infer<typeof createProductoSchema>
export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>
export type FiltrosInventarioInput = z.infer<typeof filtrosInventarioSchema>
