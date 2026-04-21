# 📋 ANÁLISIS DETALLADO: TAREA 1 + TAREA 2
**Berry Stock · Flujo de Pagos + Dashboard**  
**Fecha de análisis:** 20 de Abril de 2026  
**Estado del análisis:** ✅ SIN MODIFICACIONES DE CÓDIGO

---

## 📐 ESTADO ACTUAL DEL PROYECTO

### 🏗️ Stack Tecnológico
- **Framework:** Next.js 14 + TypeScript
- **Base de Datos:** Supabase PostgreSQL (RLS habilitado)
- **ORM/Query:** Supabase JavaScript SDK (sin Prisma)
- **Autenticación:** Supabase Auth
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS v4
- **Datos:** SWR para fetching con paginación infinita
- **Validación:** Zod schema
- **Deployment:** Vercel (indicado en contexto)

### 📊 Estructura de Base de Datos Actual

#### Tablas Principales:
```
catalogos → telas → productos → movimientos
         ↓         ↓
      (join)   (FK)
         ↓         ↓
      usuarios (auditoría)
```

**Tabla: `productos`**
- `id` (UUID, PK)
- `tela_id` (UUID, FK → telas)
- `tipo` (ENUM: matera, porta_anteojos, cubre_bidon, alfombra_vinilica)
- `medida` (TEXT nullable, obligatorio para alfombra_vinilica)
- `cantidad` (INTEGER ≥ 0)
- `estado` (ENUM: **stock | reservado | vendido**) ← **A CAMBIAR**
- `created_at, updated_at` (TIMESTAMPTZ)
- **Constraint único:** (tela_id, tipo, medida)

**Tabla: `movimientos` (Historial auditivo)**
- `id` (UUID, PK)
- `producto_id` (FK → productos)
- `tipo_movimiento` (ENUM: ingreso_stock, reserva, confirmacion_venta, devolucion_stock, ajuste_cantidad)
- `estado_anterior` (ENUM nullable)
- `estado_nuevo` (ENUM)
- `cantidad_delta` (INTEGER)
- `orden_bondarea, cliente, notas` (TEXT)
- `usuario_id` (FK → usuarios)
- `created_at` (TIMESTAMPTZ)

### 🎨 Tipos TypeScript Actuales

**Archivo:** `src/types/producto.ts`

```typescript
export type EstadoProducto = 'stock' | 'reservado' | 'vendido'
// ↑ CAMBIAR A: 'stock' | 'reservado' | 'cobrado'

export type TipoProducto = 'matera' | 'porta_anteojos' | 'cubre_bidon' | 'alfombra_vinilica'

export type TipoMovimiento = 
  'ingreso_stock' | 'reserva' | 'confirmacion_venta' | 'devolucion_stock' | 'ajuste_cantidad'
// ↑ AGREGAR: 'confirmacion_pago'
```

### 🔄 Flujo de Estados ACTUAL (A Reemplazar)

```
EN STOCK
   ├─ Botón "Reservar" → RESERVADO
   │   └─ (registra movimiento tipo: 'reserva')
   │
   ├─ Botón "Vender" (desde stock) → VENDIDO
   │   └─ (registra movimiento tipo: 'confirmacion_venta')
   │
RESERVADO
   ├─ Botón "Confirmar" → VENDIDO
   │   └─ (registra movimiento tipo: 'confirmacion_venta')
   │
   └─ Botón "Devolver" → EN STOCK
       └─ (registra movimiento tipo: 'devolucion_stock')

VENDIDO (Estado terminal)
   └─ Solo lectura (puede haber botón "Ver detalle" o similar)
```

**Problema:** Este flujo NO registra dinero cobrado ni proporciona datos financieros.

### 🎯 Vistas/Rutas Actuales

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/inventario` | `src/app/(app)/inventario/page.tsx` | Grid + Tabla de productos |
| `/inventario/:id` | `src/app/(app)/inventario/[id]/page.tsx` | Detalle del producto |
| `/inventario/:id/editar` | `src/app/(app)/inventario/[id]/editar/page.tsx` | Edición de cantidad/datos |
| `/movimientos` | `src/app/(app)/movimientos/page.tsx` | Timeline de movimientos |
| `/importar` | `src/app/(app)/importar/page.tsx` | Import CSV desde Bondarea |
| `/admin/usuarios` | `src/app/(app)/admin/usuarios/page.tsx` | Gestión de usuarios (admin) |
| `/admin/configuracion` | `src/app/(app)/admin/configuracion/page.tsx` | Configuración del sistema |

### 📦 Componentes Principales

**Inventario:**
- `src/components/inventario/TablaProductos.tsx` - Tabla responsiva
- `src/components/inventario/CardProducto.tsx` - Card grid
- `src/components/inventario/FiltrosInventario.tsx` - Filtros
- `src/components/inventario/StatsInventario.tsx` - KPIs (4 tarjetas)

**Movimientos:**
- `src/components/movimientos/FormMovimiento.tsx` - Modal de acción (reservar/vender/devolver)
- `src/components/movimientos/HistorialTimeline.tsx` - Timeline visual

**Layout:**
- `src/components/layout/Sidebar.tsx` - Navegación principal
- `src/components/layout/Topbar.tsx` - Encabezado por página
- `src/components/layout/AuthGuard.tsx` - Protección de rutas
- `src/components/layout/RoleGuard.tsx` - Control de roles

**UI Base:**
- `src/components/ui/Badge.tsx`, `Button.tsx`, `Modal.tsx`, `Input.tsx`, `Select.tsx`, `Card.tsx`

### 🔌 Rutas API

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/productos` | GET | Listar productos (paginado) |
| `/api/productos` | POST | Crear producto |
| `/api/productos/[id]` | GET/PUT/DELETE | Detalle y edición |
| `/api/movimientos` | GET | Listar movimientos (paginado) |
| `/api/movimientos` | POST | Registrar movimiento |
| `/api/importar` | POST | Importar CSV |
| `/api/exportar` | GET | Exportar Excel |
| `/api/config/tipos-producto` | GET | Tipos dinámicos |
| `/api/config/estados-producto` | GET | Estados dinámicos |

### 🧮 Hook de Datos

**`src/hooks/useProductos.ts`**
```
→ Usa SWRInfinite paginado
→ Retorna: { productos, total, hasMore, isLoading, mutate() }
```

**`src/hooks/useMovimientos.ts`**
```
→ Usa SWRInfinite opcional con producto_id
→ Retorna: { movimientos, isLoading, error, mutate() }
```

---

# 🎯 TAREA 1: REDISEÑO DEL FLUJO DE ESTADOS Y PAGOS

## 📝 Especificación Funcional

### 1.1 Cambios en el Modelo de Datos

#### A. Modificaciones en tabla `productos`

**AGREGAR columna:**
```sql
precio_unitario DECIMAL(10,2) DEFAULT NULL
-- Uso: Pre-completar monto en modal de pago
-- Nullable porque no todos los productos tienen precio fijo
-- Ejemplos: matera $500, porta anteojos $300, alfombra $1200, etc.
```

**CAMBIAR enum `estado_producto`:**
```
De:  'stock' | 'reservado' | 'vendido'
A:   'stock' | 'reservado' | 'cobrado'
```

**Justificación:**
- "Vendido" implicaba venta realizada pero sin confirmación de pago
- "Cobrado" es estado terminal que implica transacción completada
- Alineación con flujo: promesa de venta → confirmación de pago

---

#### B. NUEVA tabla `pagos` (a crear)

```sql
CREATE TABLE pagos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id       UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tela_id           UUID NOT NULL REFERENCES telas(id) ON DELETE CASCADE,
  tipo_producto     tipo_producto_mvp NOT NULL,
  medida            TEXT,
  
  -- Datos del pago
  monto             DECIMAL(10,2) NOT NULL,
  fecha_pago        TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota              TEXT,
  
  -- Auditoría
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índices
  CONSTRAINT uq_un_pago_por_producto UNIQUE(producto_id)
    -- Un producto solo puede tener UN pago
);

CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago DESC);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX idx_pagos_producto ON pagos(producto_id);
```

**Justificación:**
- Un registro por producto pagado (relación 1:1)
- Permite queryar: "Ganancias en período X"
- Auditoría: quién cobró, cuándo, por cuánto
- Vincula tela_id para queries por rubro sin JOIN a productos

---

#### C. Modificaciones en tabla `movimientos`

**AGREGAR tipo de movimiento:**
```
'confirmacion_pago'  -- Cuando se crea un pago
```

**Nuevo movimiento a registrar:**
- Tipo: `confirmacion_pago`
- Estado anterior: `reservado` (desde el cual viene)
- Estado nuevo: `cobrado`
- Campos: usuario_id, fecha, monto (se puede guardar en `notas` como JSON)

---

### 1.2 Nuevo Flujo de Estados Y Transiciones

```
                        ┌─────────────┐
                        │  EN STOCK   │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              │
        ┌─────────────┐  ┌──────────────┐  (error)
        │ RESERVADO ◄─┤  │ CONFIRMACIÓN │  
        │  (modal   │  │  │  PAGO MODAL  │
        │ Reservar) │  │  │ (modal Pagar)│
        └─────┬─────┘  │  └──────┬───────┘
              │        │         │
      (Botón "Devolver" volva a stock)
              │        │
              ▼        ▼
        ┌────────────────┐
        │   COBRADO      │
        │ (Estado Final) │
        └────────────────┘
```

#### Transiciones Permitidas:

| Estado Actual | Botón/Acción | Nuevo Estado | Modal/Confirmación |
|---------------|--------------|--------------|-------------------|
| **EN STOCK** | "Reservar" | RESERVADO | FormMovimiento (cliente + nota opcional) |
| **EN STOCK** | "Vender" | RESERVADO | *(mismo que Reservar, flujo unificado)* |
| **RESERVADO** | "Confirmar pago" | COBRADO | **ConfirmarPagoModal** (NUEVO) |
| **RESERVADO** | "Devolver" | EN STOCK | FormMovimiento (confirmación) |
| **COBRADO** | "Ver detalle" | - | Modal de lectura con datos del pago |

---

### 1.3 Interfaz: Modal "Confirmar Pago"

#### 📋 Ubicación
- Se abre desde botón en tarjeta/tabla cuando estado = RESERVADO
- Opción: Reemplazable por "drawer" lateral si lo prefieres

#### 🎨 Contenido del Modal

```
┌─────────────────────────────────────────────────┐
│ ✓ Confirmar pago                                │ ← Title
├─────────────────────────────────────────────────┤
│                                                 │
│ Producto: [Código Tela] │ [Tipo Rubro]         │
│ Medida: [Medida o "-"]                          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Monto cobrado ($) *                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ 500.00                                      │ │ ← Pre-completado con precio_unitario si existe
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Fecha de pago *                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Today date picker] 20/04/2026              │ │ ← Por defecto: hoy
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Nota (opcional)                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ "Transferencia bancaria"                    │ │ ← Helper text
│ │ "Efectivo en mano"                          │ │
│ │ "Tarjeta de crédito"                        │ │ ← Ejemplos
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar]  [Confirmar] │ ← Verde primario
└─────────────────────────────────────────────────┘
```

#### Validaciones:
- **Monto:** Numérico, > 0, máx 2 decimales
- **Fecha:** No mayor a hoy (no futuros)
- **Nota:** Máx 500 caracteres

#### Estados UI:
- **Cargando:** Botón Confirmar deshabilitado + spinner
- **Error:** Banner rojo con mensaje de Supabase
- **Success:** Cierra modal, recarga lista, toast "Pago confirmado"

---

### 1.4 Cambios en Componentes Existentes

#### A. [src/components/inventario/CardProducto.tsx](src/components/inventario/CardProducto.tsx)

**Líneas actuales con cambios:**

| Línea Actual | Cambio | Descripción |
|-----------|--------|-------------|
| Botones de acción (líneas ~70-100+) | Refactorizar | "Vender" y "Reservar" → Mismo modal (ambos van a RESERVADO) |
| Estado VENDIDO | Cambiar a COBRADO | Mostrar badge "Cobrado" con color gris (igual al vendido) |
| Badge de estado | Nuevo color | COBRADO será gris como antes VENDIDO |
| Tooltip en COBRADO | AGREGAR | "Ver pago" → abre modal o drawer con detalle |

**Nuevo comportamiento:**
```
EN STOCK:
  ├─ Botón "Reservar" → abre FormMovimiento (cliente + nota)
  └─ Botón "Vender" → MISMO FormMovimiento (esto unififica el flujo)

RESERVADO:
  ├─ Botón "Confirmar pago" → abre ConfirmarPagoModal (NUEVO)
  └─ Botón "Devolver" → abre FormMovimiento (confirmación)

COBRADO:
  └─ Botón "Ver pago" → abre PagoDetalleModal (lectura, NUEVO)
```

---

#### B. [src/components/inventario/TablaProductos.tsx](src/components/inventario/TablaProductos.tsx)

**Cambios:**

| Sección | Cambio |
|---------|--------|
| Columna "Estado" (línea ~125) | Mostrar badge actualizado (COBRADO en lugar de VENDIDO) |
| Tabla de acciones (líneas ~140+) | Igual que CardProducto (refactorizar botones) |
| Condicionales de estado | Cambiar `producto.estado === 'vendido'` por `=== 'cobrado'` |

---

#### C. [src/components/movimientos/FormMovimiento.tsx](src/components/movimientos/FormMovimiento.tsx)

**Cambios:**

| Elemento | Cambio |
|----------|--------|
| Enum de acciones (línea ~12) | Mantener: `'reservar' | 'vender' | 'devolver'` (por compatibilidad) |
| ACCION_CONFIG | Cambiar destino de "vender" de `VENDIDO` → `RESERVADO` en lugar de ir directo a VENDIDO. Este movimiento ahora registra un paso intermedio. |
| Lógica de envío (línea ~75+) | Ambas acciones "reservar" y "vender" ahora crean movimiento `tipo_movimiento: 'reserva'` con estado_nuevo = RESERVADO |

**Nueva Acción a Agregar:**

Se recomienda en lugar de cambiar el FormMovimiento existente, crear un componente nuevo:
- `ConfirmarPagoModal.tsx` para la lógica de pagos

---

#### D. [src/types/producto.ts](src/types/producto.ts)

**Cambios requeridos:**

```typescript
// Línea ~4: Cambiar
export type EstadoProducto = 'stock' | 'reservado' | 'vendido'
// A:
export type EstadoProducto = 'stock' | 'reservado' | 'cobrado'

// Línea ~27: Agregar tipo de movimiento
export type TipoMovimiento = 
  | 'ingreso_stock'
  | 'reserva'
  | 'confirmacion_venta'
  | 'devolucion_stock'
  | 'ajuste_cantidad'
  | 'confirmacion_pago'  // ← NUEVO

// Agregar interfaz Pago
export interface Pago {
  id: string
  producto_id: string
  tela_id: string
  tipo_producto: TipoProducto
  medida: string | null
  monto: number
  fecha_pago: string
  nota: string | null
  usuario_id: string | null
  usuario?: Usuario | null
  created_at: string
  updated_at: string
}

// Agregar al Producto:
export interface Producto {
  id: string
  tela_id: string
  tipo: TipoProducto
  medida: string | null
  cantidad: number
  estado: EstadoProducto
  precio_unitario?: number  // ← NUEVO
  pago?: Pago | null        // ← NUEVO (relación opcional)
  // ... resto igual
}

// Actualizar ESTADO_LABELS
export const ESTADO_LABELS: Record<EstadoProducto, string> = {
  stock: 'En stock',
  reservado: 'Reservado',
  cobrado: 'Cobrado',     // ← Cambiar de vendido
}

// Actualizar MOVIMIENTO_LABELS
export const MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  ingreso_stock: 'Ingreso a stock',
  reserva: 'Reserva',
  confirmacion_venta: 'Confirmación de venta',
  devolucion_stock: 'Devolución a stock',
  ajuste_cantidad: 'Ajuste de cantidad',
  confirmacion_pago: 'Confirmación de pago',  // ← NUEVO
}

// ESTADO_COLORS: cambiar 'vendido' a 'cobrado'
// Mismos colores (ambos grises)
export const ESTADO_COLORS: Record<EstadoProducto, string> = {
  stock: '#16a34a',
  reservado: '#ca8a04',
  cobrado: '#6b7280',      // ← Cambiar clave de vendido
}
```

---

#### E. [src/types/producto.ts](src/types/producto.ts) - Nuevos Inputs

```typescript
export interface ConfirmarPagoInput {
  producto_id: string
  monto: number
  fecha_pago: string  // ISO 8601 o Date
  nota?: string | null
}

export interface PagoStats {
  total_cobrado: number
  cantidad_pagos: number
  monto_promedio: number
  rubro_ganador: TipoProducto
  rubro_ganador_monto: number
}
```

---

### 1.5 Cambios en la Base de Datos (SQL)

#### Script a ejecutar en Supabase SQL Editor:

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- TAREA 1: Agregar tabla de pagos y modificar estados
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Agregar precio_unitario a productos
ALTER TABLE productos ADD COLUMN precio_unitario DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN productos.precio_unitario IS 'Precio unitario para pre-completar pagos';

-- 2. Crear tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id       UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
  tela_id           UUID NOT NULL REFERENCES telas(id) ON DELETE CASCADE,
  tipo_producto     tipo_producto_mvp NOT NULL,
  medida            TEXT,
  
  -- Datos del pago
  monto             DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago        TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota              TEXT,
  
  -- Auditoría
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_producto ON pagos(producto_id);

COMMENT ON TABLE pagos IS 'Registro de pagos confirmados por producto';

-- 3. Agregar nuevo tipo de movimiento al enum
-- (Nota: En PostgreSQL, ALTER TYPE requiere pasos adicionales)
ALTER TYPE tipo_movimiento ADD VALUE IF NOT EXISTS 'confirmacion_pago';

-- 4. Cambiar enum estado_producto (requiere pasos para máquina)
-- PASO 1: Crear nuevo tipo
CREATE TYPE estado_producto_v2 AS ENUM ('stock', 'reservado', 'cobrado');

-- PASO 2: Cambiar columna en productos
ALTER TABLE productos ALTER COLUMN estado TYPE estado_producto_v2 
  USING CASE 
    WHEN estado = 'vendido' THEN 'cobrado'::estado_producto_v2
    ELSE estado::text::estado_producto_v2
  END;

-- PASO 3: Cambiar columna en movimientos
ALTER TABLE movimientos ALTER COLUMN estado_nuevo TYPE estado_producto_v2 
  USING estado_nuevo::text::estado_producto_v2;

ALTER TABLE movimientos ALTER COLUMN estado_anterior TYPE estado_producto_v2 
  USING estado_anterior::text::estado_producto_v2;

-- PASO 4: Cambiar constraint
ALTER TABLE movimientos 
  DROP CONSTRAINT IF EXISTS movimientos_estado_nuevo_check,
  DROP CONSTRAINT IF EXISTS movimientos_estado_anterior_check;

-- (Los constraints se regeneran al refrescar el tipo)

-- PASO 5: Deletear tipo viejo (opcional, después de validar)
-- DROP TYPE estado_producto;

-- PASO 6: Renombrar nuevo tipo
ALTER TYPE estado_producto_v2 RENAME TO estado_producto;

-- 5. RLS para tabla pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select" ON pagos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pagos_create" ON pagos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id OR get_my_rol() = 'admin');

CREATE POLICY "pagos_update" ON pagos
  FOR UPDATE TO authenticated 
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');

-- 6. Trigger para updated_at en pagos
CREATE TRIGGER pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Actualizar tabla estados_producto_config (opcional pero recomendado)
UPDATE estados_producto_config 
SET nombre = 'Cobrado', transiciones = '{}'::text[]
WHERE codigo = 'vendido';

-- O mejor, recrear:
DELETE FROM estados_producto_config WHERE codigo = 'vendido';
INSERT INTO estados_producto_config (codigo, nombre, color, badge_class, es_terminal, transiciones, orden) 
VALUES ('cobrado', 'Cobrado', '#6b7280', 'bg-gray-100 text-gray-600 border-gray-200', true, '{}', 3);
```

---

### 1.6 Cambios en API Routes

#### A. Crear [src/app/api/pagos/route.ts](src/app/api/pagos/route.ts) (NUEVO)

```typescript
// GET: Listar pagos con filtros opcionales (fecha, usuario, etc.)
// POST: Crear nuevo pago (confirmar pago de un producto)

Parámetros GET:
  - limit (default 50, max 200)
  - offset (default 0)
  - fecha_desde (ISO string)
  - fecha_hasta (ISO string)
  - usuario_id (UUID)

Respuesta GET:
{
  data: Pago[],
  total: number,
  hasMore: boolean
}

Parámetros POST (body):
{
  producto_id: string (UUID)
  monto: number
  fecha_pago: string (ISO 8601)
  nota?: string
}

Respuesta POST 200:
{
  id: string,
  producto_id: string,
  monto: number,
  fecha_pago: string,
  created_at: string
}

Errores POST:
  400: Producto no existe / ya tiene pago / estado no es RESERVADO
  401: No autenticado
  500: Error interno
```

---

#### B. Modificar [src/app/api/movimientos/route.ts](src/app/api/movimientos/route.ts)

**Cambios:**
- Aceptar nuevo tipo `confirmacion_pago` en validación
- Al procesar movimiento de tipo `confirmacion_pago`, también hacer INSERT en tabla `pagos`
- O alternativa: que la ruta `/api/pagos` sea responsable de estos cambios

---

#### C. Modificar [src/app/api/productos/route.ts](src/app/api/productos/route.ts)

**Cambios:**
- Cambiar validación de `estado` para aceptar `cobrado` en lugar de `vendido`
- Agregar campo `precio_unitario` en respuesta

---

### 1.7 Cambios en Hooks de Datos

#### A. Crear [src/hooks/usePagos.ts](src/hooks/usePagos.ts) (NUEVO)

Similar a `useProductos` pero para la tabla `pagos`:
```typescript
export function usePagos(filtros?: PagosFilters) {
  // Llamar a /api/pagos con filtros
  // Retornar { pagos, total, hasMore, isLoading, mutate }
}
```

---

#### B. Modificar [src/hooks/useProductos.ts](src/hooks/useProductos.ts)

**Cambios:**
- Al hacer fetch, incluir `precio_unitario` en respuesta
- Cambiar validación de estado filter: 'vendido' → 'cobrado'

---

### 1.8 Componentes Nuevos a Crear

#### A. [src/components/pagos/ConfirmarPagoModal.tsx](src/components/pagos/ConfirmarPagoModal.tsx) (NUEVO)

```typescript
interface ConfirmarPagoModalProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

Export function ConfirmarPagoModal(...): JSX.Element
```

**Funcionalidades:**
- Input de monto (pre-completado con `producto.precio_unitario`)
- Input de fecha (date picker, default hoy)
- Textarea de nota
- Validaciones
- Envío a `/api/pagos` POST
- Manejo de estadosError/Loading/Success

---

#### B. [src/components/pagos/PagoDetalleDrawer.tsx](src/components/pagos/PagoDetalleDrawer.tsx) (NUEVO, OPCIONAL)

```typescript
interface PagoDetalleDrawerProps {
  pago: Pago | null
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mostrar detalles del pago en modo lectura
// Campos: monto, fecha, nota, usuario que cobró
```

---

### 1.9 Validaciones Zod a Agregar

**Archivo:** `src/lib/validations/producto.schema.ts`

```typescript
export const confirmarPagoSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  monto: z.number().positive('Monto debe ser mayor a 0').max(999999.99),
  fecha_pago: z.string().datetime('Fecha inválida'),
  nota: z.string().max(500).nullable().optional(),
})

export type ConfirmarPagoInput = z.infer<typeof confirmarPagoSchema>
```

---

### 1.10 Matriz de Cambios por Archivo

| Archivo | Tipo | Cambios |
|---------|------|---------|
| **SQL Scripts** | CREATE | Tabla `pagos`, índices, policies, triggers |
| **types/producto.ts** | EDIT | EstadoProducto, TipoMovimiento, interfaces nuevas |
| **components/inventario/CardProducto.tsx** | EDIT | Lógica de botones, estados |
| **components/inventario/TablaProductos.tsx** | EDIT | Condicionales de estado, botones |
| **components/movimientos/FormMovimiento.tsx** | EDIT | Lógica de reserva/vender |
| **components/pagos/ConfirmarPagoModal.tsx** | CREATE | Nueva modal de pagos |
| **components/pagos/PagoDetalleDrawer.tsx** | CREATE | Drawer de lectura (opcional) |
| **lib/validations/producto.schema.ts** | EDIT | Nuevos schemas Zod |
| **app/api/pagos/route.ts** | CREATE | GET/POST para pagos |
| **app/api/movimientos/route.ts** | EDIT | Incorporar confirmacion_pago |
| **hooks/usePagos.ts** | CREATE | Hook para fetching pagos |
| **hooks/useProductos.ts** | EDIT | Validación de estados |

---

# 🎯 TAREA 2: DASHBOARD FINANCIERO

## 📊 Especificación Funcional

### 2.1 Ubicación y Navegación

#### Cambios en Sidebar

**Archivo:** `src/components/layout/Sidebar.tsx`

**Insertar nueva entrada:**
```typescript
const navItems = [
  // ... resto igual hasta: Inventario ...
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart3,           // ← Cambiar por ícono grid 2x2 (Grid3x3 de Lucide)
    roles: ['admin', 'operador', 'consulta'] 
  },
  // ... resto de items
]
```

**Nueva ruta:** `/app/(app)/dashboard/page.tsx` → Crear

**Ubicación visual en sidebar:**
```
Berry Design Stock Manager
├─ Dashboard ← NUEVO (aquí, primero)
├─ Inventario
├─ Movimientos
├─ Importar (solo operador/admin)
├─ Usuarios (solo admin)
└─ Configuración (solo admin)
```

---

### 2.2 Layout General del Dashboard

```
┌────────────────────────────────────────────────────────┐
│ Dashboard                  [Período ▼]                 │ ← Topbar
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────┬──────────────┬──────────────┬────────┐ │
│ │ Tot. Cobrado │ Uds. Vendidas│ Confirmados  │ Rubro  │ │ ← 4 KPI Cards
│ │   $50,000    │      45      │ 12 de 15    │ Matera │ │
│ └──────────────┴──────────────┴──────────────┴────────┘ │
│                                                        │
│ ┌─────────────────────────────┬──────────────────────┐ │
│ │ Ventas Mensuales (gráfico)  │ Por Rubro (donut)    │ │
│ │ ████ ████ ██ ████           │     ●                │ │
│ └─────────────────────────────┴──────────────────────┘ │
│                                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Top 10 Productos Más Vendidos (tabla)               │ │
│ │ [Código] [Tipo] [Unidades] [Monto]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Últimos Pagos Confirmados (tabla)                   │ │
│ │ [Fecha] [Código] [Tipo] [Monto] [Nota]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 2.3 Componentes del Dashboard

#### **SECCIÓN 1: Filtro de Período**

```
[Este mes ▼] Modo: 
- Este mes  → últimos 30 días
- Este año  → 1 Ene - 31 Dic de este año
- Todo el tiempo → desde tabla_pagos inicio
- Rango personalizado → [Desde] [Hasta] (date pickers)
```

**Ubicación:** Top-right de Topbar (o debajo de título)

**Lógica:**
- Afecta TODOS los componentes del dashboard
- Reactive: cambiar período → refetch de datos
- State: `periode` = { type: 'month' | 'year' | 'all' | 'custom', from?: Date, to?: Date }

---

#### **SECCIÓN 2: KPI Cards (4 tarjetas)**

Utilizar componente existente `StatsInventario` o crear nuevo `DashboardStats`

```
Card 1: Total Cobrado
┌─────────────────────┐
│ 💰 Total Cobrado    │
│                     │
│    $47,350.00       │ ← Formateado ARS
│  (Período anterior) │ ← Comparativa opc.
└─────────────────────┘

Card 2: Unidades Vendidas
┌─────────────────────┐
│ 📦 Unidades         │
│                     │
│       45            │ ← Count distinto de productos en COBRADO
│ (productos únicos)  │
└─────────────────────┘

Card 3: Pagos Confirmados
┌─────────────────────┐
│ ✓ Confirmados       │
│                     │
│    12 de 15         │ ← 12 pagos realizados, 15 reservados pendientes
│ (12 / 15 pendientes)│
└─────────────────────┘

Card 4: Rubro Ganador
┌─────────────────────┐
│ 🏆 Rubro Ganador    │
│                     │
│ Matera - $18,500    │ ← Tipo con mayor suma de pagos
│ (39% del total)     │
│ [Badge verde]       │
└─────────────────────┘
```

**Queries requeridas:**
```
-- KPI 1: Total cobrado
SELECT SUM(monto) as total FROM pagos WHERE fecha_pago BETWEEN ? AND ?;

-- KPI 2: Unidades vendidas
SELECT COUNT(DISTINCT producto_id) FROM pagos WHERE fecha_pago BETWEEN ? AND ?;

-- KPI 3: Pagos / Pendientes
SELECT 
  (SELECT COUNT(*) FROM pagos WHERE fecha_pago BETWEEN ? AND ?) as pagados,
  (SELECT COUNT(*) FROM productos WHERE estado = 'reservado') as pendientes;

-- KPI 4: Rubro ganador
SELECT 
  tipo_producto, 
  SUM(monto) as total 
FROM pagos 
WHERE fecha_pago BETWEEN ? AND ? 
GROUP BY tipo_producto 
ORDER BY total DESC 
LIMIT 1;
```

---

#### **SECCIÓN 3: Gráfico Ventas Mensuales (Barras)**

**Librería:** Recharts (ya instalada en el proyecto)

**Datos:**
```
{
  label: 'Enero', value: 5200
  label: 'Febrero', value: 8500
  label: 'Marzo', value: 12300
  ...
  label: 'Diciembre', value: 0  // ← Si no hay datos
}
```

**Query:**
```sql
SELECT 
  DATE_TRUNC('month', fecha_pago) as mes,
  SUM(monto) as total
FROM pagos
WHERE fecha_pago BETWEEN ? AND ?
GROUP BY DATE_TRUNC('month', fecha_pago)
ORDER BY mes ASC;
```

**Visualización:**
- Eje X: Nombres de meses abreviados (Ene, Feb, Mar...)
- Eje Y: Montos en ARS (0 - máximo detectado + 20%)
- Barras: Color primario (#851919)
- Tooltip: "Marzo: $12,300.00"
- Responsive: En mobile, rotar 90° u omitir labels

---

#### **SECCIÓN 4: Gráfico Ventas por Rubro (Donut)**

**Librería:** Recharts PieChart con `innerRadius`

**Datos:**
```
[
  { name: 'Matera', value: 18500, color: '#851919' },
  { name: 'Porta anteojos', value: 12000, color: '#e74c3c' },
  { name: 'Cubre bidón', value: 8200, color: '#f39c12' },
  { name: 'Alfombra vinílica', value: 8650, color: '#3498db' },
]
```

**Query:**
```sql
SELECT 
  tipo_producto,
  SUM(monto) as total,
  ROUND(100 * SUM(monto) / GREATEST(SUM(SUM(monto)) OVER(), 1), 1) as porcentaje
FROM pagos
WHERE fecha_pago BETWEEN ? AND ?
GROUP BY tipo_producto
ORDER BY total DESC;
```

**Visualización:**
```
        ┌─ Leyenda lateral ─┐
        │ Matera            │
        │ $18,500 (39%)     │
╱─────╲ │                   │
│(●)───┼─┤ Porta anteojos   │
╲─────╱ │ $12,000 (26%)     │
        │ ...               │
        └───────────────────┘
```

- PieChart con innerRadius = 60
- Colores: Asignar por rubro
- Label: Nombres de rubros + porcentaje
- Tooltip: Nombre, monto, porcentaje

---

#### **SECCIÓN 5: Tabla Top 10 Productos**

**Estructura:**

| Código Tela | Tipo | Unidades | Monto Total | % |
|------------|------|----------|-------------|---|
| 27/0001 | Matera | 8 | $4,000 | ████░ 25% |
| 23/0002 | Porta anteojos | 6 | $2,100 | ███░░ 13% |
| 30/0015 | Alfombra vinílica | 5 | $1,750 | ██░░░ 11% |

**Query:**
```sql
SELECT 
  t.codigo,
  p.tipo_producto,
  COUNT(p.producto_id) as unidades,
  SUM(p.monto) as total_cobrado,
  ROUND(100 * SUM(p.monto) / GREATEST((SELECT SUM(monto) FROM pagos WHERE fecha_pago BETWEEN ? AND ?), 1), 1) as porcentaje
FROM pagos p
JOIN telas t ON p.tela_id = t.id
WHERE p.fecha_pago BETWEEN ? AND ?
GROUP BY t.codigo, p.tipo_producto
ORDER BY total_cobrado DESC
LIMIT 10;
```

**Características:**
- Barra de progreso horizontal: ancho proporcional al max(total_cobrado)
- Scroll horizontal en mobile
- Botón de exportación Excel → datos completos (reutilizar export existente)

---

#### **SECCIÓN 6: Tabla Últimos Pagos**

**Estructura:**

| Fecha | Código | Tipo | Monto | Nota |
|-------|--------|------|-------|------|
| 20/04/2026 | 27/0001 | Matera | $500 | Transferencia |
| 19/04/2026 | 23/0002 | Porta anteojos | $300 | Efectivo |

**Query:**
```sql
SELECT 
  p.id,
  p.fecha_pago,
  t.codigo,
  p.tipo_producto,
  p.monto,
  p.nota,
  u.nombre as usuario
FROM pagos p
JOIN telas t ON p.tela_id = t.id
LEFT JOIN usuarios u ON p.usuario_id = u.id
WHERE p.fecha_pago BETWEEN ? AND ?
ORDER BY p.fecha_pago DESC
LIMIT 10;
```

**Características:**
- Última columna con ícono/acciones: expandir, ver detalles
- Badge de color por rubro (colores consistentes con donut)
- Fechas formateadas (DD/MM/YYYY)
- Montos formateados ARS
- Nota con ellipsis si es muy larga

---

### 2.4 Responsividad

**Mobile (< 640px):**
- KPI Cards: 2 columnas (en lugar de 4)
- Gráficos: Apilados verticalmente
- Tablas: Scroll horizontal
- Período selector: En drawer separado (?)

**Tablet (640px - 1024px):**
- KPI Cards: 2 columnas (lado a lado)
- Gráficos: Lado a lado, altura reducida
- Tablas: Completas pero sin scroll

**Desktop (> 1024px):**
- Diseño como se especificó arriba

---

### 2.5 Estados Vacíos

**Si no hay datos para el período:**

```
┌─────────────────────────────────┐
│                                 │
│  📭 Sin datos para este período │
│                                 │
│  No hay pagos registrados en:   │
│  [Rango de fechas]              │
│                                 │
│  Intenta cambiar el período     │
│  o crear nuevos pagos.          │
│                                 │
│              [Volver a Inventario]
│                                 │
└─────────────────────────────────┘
```

---

### 2.6 Rutas API para Dashboard

#### A. Crear [src/app/api/dashboard/stats/route.ts](src/app/api/dashboard/stats/route.ts) (NUEVO)

```typescript
// GET: Retornar KPIs agregados

Parámetros:
  - fecha_desde: string (ISO)
  - fecha_hasta: string (ISO)

Respuesta 200:
{
  total_cobrado: number,
  unidades_vendidas: number,
  pagos_confirmados: number,
  pagos_pendientes: number,
  rubro_ganador: {
    tipo: TipoProducto,
    monto: number,
    porcentaje: number
  }
}
```

---

#### B. Crear [src/app/api/dashboard/ventas-mensuales/route.ts](src/app/api/dashboard/ventas-mensuales/route.ts) (NUEVO)

```typescript
// GET: Ventas por mes

Parámetros:
  - fecha_desde: string (ISO)
  - fecha_hasta: string (ISO)

Respuesta 200:
[
  { mes: 'Enero', total: 5200 },
  { mes: 'Febrero', total: 8500 },
  ...
]
```

---

#### C. Crear [src/app/api/dashboard/por-rubro/route.ts](src/app/api/dashboard/por-rubro/route.ts) (NUEVO)

```typescript
// GET: Ventas desagregadas por rubro

Respuesta 200:
[
  { rubro: 'matera', total: 18500, porcentaje: 39 },
  { rubro: 'porta_anteojos', total: 12000, porcentaje: 26 },
  ...
]
```

---

#### D. Crear [src/app/api/dashboard/top-productos/route.ts](src/app/api/dashboard/top-productos/route.ts) (NUEVO)

```typescript
// GET: Top 10 productos

Respuesta 200:
[
  {
    codigo_tela: '27/0001',
    tipo: 'matera',
    unidades: 8,
    total_cobrado: 4000,
    porcentaje: 25
  },
  ...
]
```

---

#### E. Crear [src/app/api/dashboard/ultimos-pagos/route.ts](src/app/api/dashboard/ultimos-pagos/route.ts) (NUEVO)

```typescript
// GET: Últimos 10 pagos

Respuesta 200:
[
  {
    id: UUID,
    fecha_pago: ISO string,
    codigo_tela: '27/0001',
    tipo: 'matera',
    monto: 500,
    nota: 'Transferencia',
    usuario: 'Juan Pérez'
  },
  ...
]
```

---

### 2.7 Componentes Dashboard a Crear

#### A. [src/app/(app)/dashboard/page.tsx](src/app/(app)/dashboard/page.tsx) (NUEVO)

```typescript
'use server' // O 'use client' + Server Component

export default function DashboardPage() {
  // Fetch data on server
  // Pass to client components
}
```

---

#### B. [src/components/dashboard/DashboardStats.tsx](src/components/dashboard/DashboardStats.tsx) (NUEVO)

```typescript
interface DashboardStatsProps {
  stats: {
    total_cobrado: number
    unidades_vendidas: number
    pagos_confirmados: number
    rubro_ganador: { tipo: string; monto: number; porcentaje: number }
  }
}

export function DashboardStats(props): JSX.Element
// 4 tarjetas KPI
```

---

#### C. [src/components/dashboard/VentasMonsualesChart.tsx](src/components/dashboard/VentasMonsualesChart.tsx) (NUEVO)

```typescript
interface VentasMonsualesChartProps {
  data: Array<{ mes: string; total: number }>
}

export function VentasMonsualesChart(props): JSX.Element
// Componente Recharts BarChart
```

---

#### D. [src/components/dashboard/VentasPorRubroChart.tsx](src/components/dashboard/VentasPorRubroChart.tsx) (NUEVO)

```typescript
interface VentasPorRubroChartProps {
  data: Array<{ rubro: string; total: number; porcentaje: number }>
}

export function VentasPorRubroChart(props): JSX.Element
// Componente Recharts PieChart
```

---

#### E. [src/components/dashboard/TopProductosTable.tsx](src/components/dashboard/TopProductosTable.tsx) (NUEVO)

```typescript
interface TopProductosTableProps {
  data: TopProducto[]
}

export function TopProductosTable(props): JSX.Element
// Tabla HTML con barra de progreso
```

---

#### F. [src/components/dashboard/UltimosPagosTable.tsx](src/components/dashboard/UltimosPagosTable.tsx) (NUEVO)

```typescript
interface UltimosPagosTableProps {
  data: Pago[]
}

export function UltimosPagosTable(props): JSX.Element
// Tabla de últimos pagos
```

---

#### G. [src/components/dashboard/PeriodoSelector.tsx](src/components/dashboard/PeriodoSelector.tsx) (NUEVO)

```typescript
interface PeriodoSelectorProps {
  selectedPeriodo: PeriodoFilter
  onPeriodoChange: (periodo: PeriodoFilter) => void
}

export function PeriodoSelector(props): JSX.Element
// Select + date pickers para rango personalizado
```

---

### 2.8 Hooks Dashboard a Crear

#### A. [src/hooks/useDashboardStats.ts](src/hooks/useDashboardStats.ts) (NUEVO)

```typescript
export function useDashboardStats(periodo: PeriodoFilter) {
  // Fetch a /api/dashboard/stats
  // Retornar { stats, isLoading, error, mutate }
}
```

---

#### B. [src/hooks/useDashboardData.ts](src/hooks/useDashboardData.ts) (NUEVO)

```typescript
export function useDashboardData(periodo: PeriodoFilter) {
  // Fetch en paralelo:
  //   - /api/dashboard/stats
  //   - /api/dashboard/ventas-mensuales
  //   - /api/dashboard/por-rubro
  //   - /api/dashboard/top-productos
  //   - /api/dashboard/ultimos-pagos
  
  // Retornar { stats, ventas, rubros, topProductos, ultimosPagos, isLoading }
}
```

---

### 2.9 Tipos Nuevos para Dashboard

**Agregar a [src/types/producto.ts](src/types/producto.ts):**

```typescript
// Filtro de período
export type PeriodoType = 'mes' | 'año' | 'todo' | 'custom'

export interface PeriodoFilter {
  tipo: PeriodoType
  desde?: Date | string
  hasta?: Date | string
}

// Stats
export interface DashboardStats {
  total_cobrado: number
  unidades_vendidas: number
  pagos_confirmados: number
  pagos_pendientes: number
  rubro_ganador: {
    tipo: TipoProducto
    monto: number
    porcentaje: number
  }
}

// Ventas mensuales
export interface VentaMensual {
  mes: string  // "Enero", "Febrero", etc.
  total: number
}

// Por rubro
export interface VentaPorRubro {
  rubro: TipoProducto
  total: number
  porcentaje: number
}

// Top producto
export interface TopProducto {
  codigo_tela: string
  tipo: TipoProducto
  unidades: number
  total_cobrado: number
  porcentaje: number
}

// Último pago
export interface UltimoPago extends Pago {
  codigo_tela: string
  usuario_nombre: string | null
}
```

---

### 2.10 Matriz de Cambios - TAREA 2

| Archivo | Tipo | Cambios |
|---------|------|---------|
| **components/layout/Sidebar.tsx** | EDIT | Agregar entrada "Dashboard" |
| **app/(app)/dashboard/page.tsx** | CREATE | Página principal del dashboard |
| **components/dashboard/DashboardStats.tsx** | CREATE | KPI cards (4) |
| **components/dashboard/VentasMonsualesChart.tsx** | CREATE | Gráfico de barras |
| **components/dashboard/VentasPorRubroChart.tsx** | CREATE | Gráfico donut |
| **components/dashboard/TopProductosTable.tsx** | CREATE | Tabla top 10 |
| **components/dashboard/UltimosPagosTable.tsx** | CREATE | Tabla últimos pagos |
| **components/dashboard/PeriodoSelector.tsx** | CREATE | Selector de período |
| **app/api/dashboard/stats/route.ts** | CREATE | API KPIs |
| **app/api/dashboard/ventas-mensuales/route.ts** | CREATE | API ventas mensuales |
| **app/api/dashboard/por-rubro/route.ts** | CREATE | API por rubro |
| **app/api/dashboard/top-productos/route.ts** | CREATE | API top 10 |
| **app/api/dashboard/ultimos-pagos/route.ts** | CREATE | API últimos pagos |
| **hooks/useDashboardStats.ts** | CREATE | Hook KPIs |
| **hooks/useDashboardData.ts** | CREATE | Hook agregado |
| **types/producto.ts** | EDIT | Nuevos interfaces |

---

# 🔗 DEPENDENCIAS EXTERNAS

Para TAREA 2 (Dashboard), ya está instalado:
- **recharts**: Para gráficos (BarChart, PieChart)
- **lucide-react**: Para iconos (BarChart3, etc.)

Verificar en `package.json`:
```json
{
  "recharts": "^2.x.x",
  "lucide-react": "^1.8.0"
}
```

---

# 📋 CHECKLIST DE IMPLEMENTACIÓN

## TAREA 1: Flujo de Pagos

### Base de Datos
- [ ] Ejecutar script SQL: agregar `precio_unitario` a productos
- [ ] Ejecutar script SQL: crear tabla `pagos`
- [ ] Ejecutar script SQL: cambiar enum `estado_producto` a 'cobrado'
- [ ] Ejecutar script SQL: agregar tipo `confirmacion_pago` a `tipo_movimiento`
- [ ] Ejecutar script SQL: agregar RLS policies a tabla `pagos`
- [ ] Ejecutar script SQL: crear trigger `updated_at` en `pagos`

### TypeScript
- [ ] Modificar `src/types/producto.ts`: cambiar `EstadoProducto`
- [ ] Agregar interfaz `Pago` en tipos
- [ ] Agregar `TipoMovimiento: 'confirmacion_pago'`
- [ ] Actualizar `ESTADO_LABELS`, `ESTADO_COLORS`, etc.
- [ ] Agregar schemas Zod para confirmar pago

### API Routes
- [ ] Crear `src/app/api/pagos/route.ts` (GET/POST)
- [ ] Modificar `src/app/api/movimientos/route.ts` (soportar confirmacion_pago)
- [ ] Modificar `src/app/api/productos/route.ts` (incluir precio_unitario)

### Componentes UI
- [ ] Crear `src/components/pagos/ConfirmarPagoModal.tsx`
- [ ] Modificar `src/components/inventario/CardProducto.tsx`
- [ ] Modificar `src/components/inventario/TablaProductos.tsx`
- [ ] Modificar `src/components/movimientos/FormMovimiento.tsx`
- [ ] Crear `src/components/pagos/PagoDetalleDrawer.tsx` (opcional)

### Hooks
- [ ] Crear `src/hooks/usePagos.ts`
- [ ] Modificar `src/hooks/useProductos.ts`

---

## TAREA 2: Dashboard

### Base de Datos
- [ ] Crear índices optimizados en tabla `pagos` para queries frecuentes

### API Routes
- [ ] Crear `src/app/api/dashboard/stats/route.ts`
- [ ] Crear `src/app/api/dashboard/ventas-mensuales/route.ts`
- [ ] Crear `src/app/api/dashboard/por-rubro/route.ts`
- [ ] Crear `src/app/api/dashboard/top-productos/route.ts`
- [ ] Crear `src/app/api/dashboard/ultimos-pagos/route.ts`

### Tipos
- [ ] Agregar tipos dashboard en `src/types/producto.ts`

### Componentes Dashboard
- [ ] Crear `src/app/(app)/dashboard/page.tsx`
- [ ] Crear `src/components/dashboard/DashboardStats.tsx`
- [ ] Crear `src/components/dashboard/VentasMonsualesChart.tsx`
- [ ] Crear `src/components/dashboard/VentasPorRubroChart.tsx`
- [ ] Crear `src/components/dashboard/TopProductosTable.tsx`
- [ ] Crear `src/components/dashboard/UltimosPagosTable.tsx`
- [ ] Crear `src/components/dashboard/PeriodoSelector.tsx`

### Hooks Dashboard
- [ ] Crear `src/hooks/useDashboardStats.ts`
- [ ] Crear `src/hooks/useDashboardData.ts`

### Layout
- [ ] Modificar `src/components/layout/Sidebar.tsx`: agregar entrada "Dashboard"

---

# 🎨 Notas de Diseño

### Paleta de Colores (Mantener)
- **Primary:** #851919 (Berry Purple)
- **Success (Stock):** #16a34a (Green)
- **Warning (Reservado):** #ca8a04 (Amber)
- **Terminal (Cobrado):** #6b7280 (Gray)

### Tipografía
- **Font:** Inter (ya configurada)
- **Headings:** font-bold
- **Body:** font-normal, 14px
- **Small:** 12px

### Componentes Reutilizables
- Usar `Modal`, `Button`, `Badge`, `Input`, `Select` de UI existentes
- Mantener consistencia con shadcn/ui + Radix UI

### Accesibilidad
- ARIA labels en inputs
- Keyboard navigation en modales
- Contrast ratios WCAG AA mínimo

---

# 🧪 Flujo de Testing Manual (Post-Implementación)

### TAREA 1
1. Crear un producto en estado EN STOCK
2. Hacer clic en "Reservar" → debe ir a RESERVADO
3. Hacer clic en "Confirmar pago" → abre ConfirmarPagoModal
4. Completar monto, fecha, nota → guardar
5. Verificar: estado cambia a COBRADO
6. Verificar: registro en tabla `pagos` fue creado
7. Verificar: aparece en historial de movimientos tipo 'confirmacion_pago'
8. Desde estado RESERVADO, hacer clic en "Devolver" → vuelve a EN STOCK

### TAREA 2
1. Acceder a `/dashboard`
2. Verificar que aparezcan KPI cards con datos
3. Cambiar período → datos se actualizan
4. Verificar gráficos cargan correctamente
5. En tabla top productos, verificar barra de progreso
6. Ordenamiento y responsividad en mobile

---

# 📞 Contactos Para Dudas

**Archivo para referencia durante implementación:**
- Este documento: análisis sin modificios
- Schema SQL: `sql/001_schema.sql` (versión antes de cambios)
- Tipos TypeScript actuales: `src/types/producto.ts`

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Migración de datos:** Si hay productos existentes en estado 'vendido', hacer UPDATE antes de cambiar enum.

2. **Backward compatibility:** El cambio de VENDIDO a COBRADO es breaking. Considerar comunicación a usuarios.

3. **Performance:** Las queries del dashboard pueden ser lentas con muchos datos. Considerar:
   - Índices en tabla `pagos` (fecha_pago, usuario_id, tipo_producto)
   - Materializar vistas si lo requiere

4. **Timezone:** Supabase retorna UTC. Asegurarse que frontend convierte a zona horaria local del usuario.

5. **Permissions:** RLS policies en tabla `pagos` deben permitir:
   - Lectura: todos los usuarios autenticados
   - Escritura: solo admin u operador (validar en backend)

---

**FIN DEL ANÁLISIS**

*Documento generado: 20 de Abril de 2026*  
*Estado: ✅ Análisis completo sin modificación de código*
