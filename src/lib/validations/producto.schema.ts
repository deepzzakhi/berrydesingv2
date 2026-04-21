import { z } from 'zod'

export const tipoProductoEnum = z.enum([
  'matera',
  'porta_anteojos',
  'cubre_bidon',
  'alfombra_vinilica',
])

export const estadoProductoEnum = z.enum(['stock', 'reservado', 'cobrado'])

export const tipoMovimientoEnum = z.enum([
  'ingreso_stock',
  'reserva',
  'confirmacion_venta',
  'confirmacion_pago',
  'devolucion_stock',
  'ajuste_cantidad',
])

export const venderSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  cantidad: z
    .number({ error: 'La cantidad debe ser un número' })
    .int()
    .positive('La cantidad debe ser al menos 1'),
  monto: z
    .number({ error: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0')
    .max(999999.99, 'El monto no puede superar $999,999.99'),
  fecha_pago: z.string().min(1, 'La fecha de pago es obligatoria'),
  cliente_nombre: z.string().min(1, 'El nombre del cliente es obligatorio').max(100),
  cliente_apellido: z.string().min(1, 'El apellido del cliente es obligatorio').max(100),
  cliente_dni: z.string().max(20).nullable().optional(),
  cliente_email: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
  nota: z.string().max(500).nullable().optional(),
})

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
  tipo: z.string().min(1, 'El tipo es obligatorio'),
  medida: z.string().nullable().optional(),
  cantidad: z
    .number({ error: 'La cantidad debe ser un número' })
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
    .number({ error: 'La cantidad debe ser un número' })
    .int()
    .optional(),
  orden_bondarea: z.string().max(100).nullable().optional(),
  cliente: z.string().max(200).nullable().optional(),
  notas: z.string().max(1000).nullable().optional(),
})

export const filtrosInventarioSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.string().optional(),
  tipo: z.string().optional(),
})

export type CreateTelaInput = z.infer<typeof createTelaSchema>
export type CreateProductoInput = z.infer<typeof createProductoSchema>
export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>
export type VenderInput = z.infer<typeof venderSchema>
export type FiltrosInventarioInput = z.infer<typeof filtrosInventarioSchema>
