# 🎯 GUÍA RÁPIDA: TAREA 1 + TAREA 2
*Quick Reference Document*

---

## 📊 ESTRUCTURA DE BASE DE DATOS - CAMBIOS REQUERIDOS

### CAMBIOS TAREA 1

```sql
-- 1. Nueva columna en productos
ALTER TABLE productos ADD COLUMN precio_unitario DECIMAL(10,2);

-- 2. Nueva tabla pagos
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL UNIQUE REFERENCES productos(id),
  tela_id UUID NOT NULL REFERENCES telas(id),
  tipo_producto tipo_producto_mvp NOT NULL,
  medida TEXT,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago TIMESTAMPTZ DEFAULT now(),
  nota TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cambiar enum estado_producto
-- De: 'stock' | 'reservado' | 'vendido'
-- A:  'stock' | 'reservado' | 'cobrado'

-- 4. Agregar tipo movimiento
-- Nuevo: 'confirmacion_pago'
```

---

## 🔄 FLUJO DE ESTADOS - ANTES vs DESPUÉS

### ❌ ANTES (Actual)
```
EN STOCK
  ├─ Reservar → RESERVADO
  │   └─ Vender → VENDIDO (Final)
  │   └─ Devolver → EN STOCK
  └─ Vender → VENDIDO (Final)
```

### ✅ DESPUÉS (Propuesto)
```
EN STOCK
  ├─ Reservar → RESERVADO
  │   ├─ Confirmar pago → COBRADO (Final) ← NUEVO
  │   └─ Devolver → EN STOCK
  └─ Vender → RESERVADO (Igual que Reservar)
```

**Cambio clave:** Intermediar RESERVADO antes de cobro, registro de pago monetario.

---

## 🗂️ ARCHIVOS: MATRIZ DE CAMBIOS

### TAREA 1 - Flujo de Pagos

```
📝 CREAR
├─ src/components/pagos/ConfirmarPagoModal.tsx
├─ src/components/pagos/PagoDetalleDrawer.tsx (opcional)
├─ src/hooks/usePagos.ts
└─ src/app/api/pagos/route.ts

✏️  MODIFICAR
├─ sql/001_schema.sql (agregar tabla pagos)
├─ src/types/producto.ts (estados, tipos Pago)
├─ src/components/inventario/CardProducto.tsx (botones)
├─ src/components/inventario/TablaProductos.tsx (condiciones)
├─ src/components/movimientos/FormMovimiento.tsx (lógica de vender/reservar)
├─ src/hooks/useProductos.ts (validación de estados)
├─ src/app/api/movimientos/route.ts (nuevo tipo de movimiento)
└─ src/app/api/productos/route.ts (incluir precio_unitario)
```

### TAREA 2 - Dashboard

```
📝 CREAR
├─ src/app/(app)/dashboard/page.tsx
├─ src/components/dashboard/DashboardStats.tsx (4 KPI cards)
├─ src/components/dashboard/VentasMonsualesChart.tsx (barras)
├─ src/components/dashboard/VentasPorRubroChart.tsx (donut)
├─ src/components/dashboard/TopProductosTable.tsx (top 10)
├─ src/components/dashboard/UltimosPagosTable.tsx (últimos 10)
├─ src/components/dashboard/PeriodoSelector.tsx (filtro)
├─ src/hooks/useDashboardStats.ts
├─ src/hooks/useDashboardData.ts
├─ src/app/api/dashboard/stats/route.ts
├─ src/app/api/dashboard/ventas-mensuales/route.ts
├─ src/app/api/dashboard/por-rubro/route.ts
├─ src/app/api/dashboard/top-productos/route.ts
└─ src/app/api/dashboard/ultimos-pagos/route.ts

✏️  MODIFICAR
├─ src/components/layout/Sidebar.tsx (agregar entrada dashboard)
└─ src/types/producto.ts (nuevos tipos dashboard)
```

---

## 🎨 INTERFAZ: MODAL CONFIRMAR PAGO

```
┌──────────────────────────────────────────┐
│ ✓ Confirmar pago                   [×]   │
├──────────────────────────────────────────┤
│                                          │
│ Código: 27/0001 | Tipo: Matera           │
│ Medida: -                                │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│ Monto ($) *                              │
│ ┌────────────────────────────────────┐  │
│ │ 500.00                             │  │ ← Precompletado
│ └────────────────────────────────────┘  │
│                                          │
│ Fecha de pago *                          │
│ ┌────────────────────────────────────┐  │
│ │ 20/04/2026                         │  │ ← Date picker
│ └────────────────────────────────────┘  │
│                                          │
│ Nota (opcional)                          │
│ ┌────────────────────────────────────┐  │
│ │ Ej: Transferencia bancaria         │  │ ← Helper text
│ └────────────────────────────────────┘  │
│                                          │
├──────────────────────────────────────────┤
│                    [Cancelar]  [Confirmar]
└──────────────────────────────────────────┘
```

---

## 📊 DASHBOARD - LAYOUT VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard              [Período ▼] Este mes                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────┬──────────────┬──────────────┬───────────────┐ │
│ │ 💰 Tot.      │ 📦 Unids.    │ ✓ Confirm.   │ 🏆 Rubro      │ │
│ │ $47,350      │ 45           │ 12/15        │ Matera        │ │
│ └──────────────┴──────────────┴──────────────┴───────────────┘ │
│                                                                 │
│ ┌──────────────────────────────┬────────────────────────────┐  │
│ │ Ventas Mensuales (barras)    │ Por Rubro (donut)          │  │
│ │  │                           │                 ●          │  │
│ │  │  ████ ████ ██ ████        │ Matera:  $18.5K (39%)     │  │
│ │  │  ████ ████ ██ ████        │ Porta:   $12K   (26%)     │  │
│ │  └─────────────────────────  │ Cubre:   $8.2K  (17%)     │  │
│ └──────────────────────────────┴────────────────────────────┘  │
│                                                                 │
│ Top 10 Productos                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Código   │ Tipo │ Unids │ Monto   │ %                       │ │
│ │ 27/0001  │ Mat  │ 8     │ $4.0K   │ ████████░░ 25%         │ │
│ │ 23/0002  │ Port │ 6     │ $2.1K   │ ██████░░░░ 13%         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Últimos Pagos                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Fecha    │ Código │ Tipo │ Monto │ Nota                    │ │
│ │ 20/04    │ 27/001 │ Mat  │ $500  │ Transferencia           │ │
│ │ 19/04    │ 23/002 │ Port │ $300  │ Efectivo                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS - TAREA 1

### POST /api/pagos
```json
// Request
{
  "producto_id": "uuid",
  "monto": 500.00,
  "fecha_pago": "2026-04-20T10:30:00Z",
  "nota": "Transferencia bancaria"
}

// Response 200
{
  "id": "uuid",
  "producto_id": "uuid",
  "monto": 500.00,
  "fecha_pago": "2026-04-20T10:30:00Z",
  "estado_producto": "cobrado",
  "movimiento_id": "uuid"
}

// Error 400
{
  "error": "El producto ya tiene un pago registrado"
}
```

### GET /api/pagos
```json
// Parámetros
?limit=50&offset=0&fecha_desde=2026-01-01&fecha_hasta=2026-12-31

// Response 200
{
  "data": [
    {
      "id": "uuid",
      "producto_id": "uuid",
      "monto": 500.00,
      "fecha_pago": "2026-04-20",
      "nota": "Transferencia"
    }
  ],
  "total": 145,
  "hasMore": true
}
```

---

## 🔌 API ENDPOINTS - TAREA 2

### GET /api/dashboard/stats
```json
// Parámetros
?fecha_desde=2026-01-01&fecha_hasta=2026-12-31

// Response
{
  "total_cobrado": 47350.00,
  "unidades_vendidas": 45,
  "pagos_confirmados": 12,
  "pagos_pendientes": 3,
  "rubro_ganador": {
    "tipo": "matera",
    "monto": 18500.00,
    "porcentaje": 39
  }
}
```

### GET /api/dashboard/ventas-mensuales
```json
[
  { "mes": "Enero", "total": 5200.00 },
  { "mes": "Febrero", "total": 8500.00 },
  { "mes": "Marzo", "total": 12300.00 }
]
```

### GET /api/dashboard/por-rubro
```json
[
  { "rubro": "matera", "total": 18500.00, "porcentaje": 39 },
  { "rubro": "porta_anteojos", "total": 12000.00, "porcentaje": 26 },
  { "rubro": "cubre_bidon", "total": 8200.00, "porcentaje": 17 },
  { "rubro": "alfombra_vinilica", "total": 8650.00, "porcentaje": 18 }
]
```

### GET /api/dashboard/top-productos
```json
[
  {
    "codigo_tela": "27/0001",
    "tipo": "matera",
    "unidades": 8,
    "total_cobrado": 4000.00,
    "porcentaje": 25
  },
  // ... 9 más
]
```

### GET /api/dashboard/ultimos-pagos
```json
[
  {
    "id": "uuid",
    "fecha_pago": "2026-04-20",
    "codigo_tela": "27/0001",
    "tipo": "matera",
    "monto": 500.00,
    "nota": "Transferencia",
    "usuario": "Juan Pérez"
  },
  // ... 9 más
]
```

---

## 📝 VALIDACIONES ZODS NUEVAS

```typescript
// confirmar pago
export const confirmarPagoSchema = z.object({
  producto_id: z.string().uuid(),
  monto: z.number()
    .positive('Debe ser > 0')
    .multipleOf(0.01, 'Máx 2 decimales')
    .max(999999.99),
  fecha_pago: z.coerce.date()
    .max(new Date(), 'No puede ser futura'),
  nota: z.string().max(500).nullable().optional(),
})

// Período dashboard
export const periodoFilterSchema = z.object({
  tipo: z.enum(['mes', 'año', 'todo', 'custom']),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
})
```

---

## 🧮 QUERIES CLAVE (SQL)

```sql
-- KPI: Total cobrado
SELECT SUM(monto) 
FROM pagos 
WHERE fecha_pago BETWEEN $1 AND $2;

-- KPI: Unidades vendidas
SELECT COUNT(DISTINCT producto_id) 
FROM pagos 
WHERE fecha_pago BETWEEN $1 AND $2;

-- KPI: Rubro ganador
SELECT tipo_producto, SUM(monto) as total
FROM pagos 
WHERE fecha_pago BETWEEN $1 AND $2
GROUP BY tipo_producto 
ORDER BY total DESC 
LIMIT 1;

-- Gráfico: Ventas por mes
SELECT 
  DATE_TRUNC('month', fecha_pago)::date as mes,
  SUM(monto) as total
FROM pagos 
WHERE fecha_pago BETWEEN $1 AND $2
GROUP BY DATE_TRUNC('month', fecha_pago)
ORDER BY mes;

-- Top 10 productos
SELECT 
  t.codigo,
  p.tipo_producto,
  COUNT(*) as unidades,
  SUM(p.monto) as total
FROM pagos p
JOIN telas t ON p.tela_id = t.id
WHERE p.fecha_pago BETWEEN $1 AND $2
GROUP BY t.codigo, p.tipo_producto
ORDER BY total DESC 
LIMIT 10;
```

---

## 🎯 TIPOS TYPESCRIPT NUEVOS

```typescript
// Estados
export type EstadoProducto = 'stock' | 'reservado' | 'cobrado'

// Movimientos
export type TipoMovimiento = 
  | 'ingreso_stock'
  | 'reserva'
  | 'confirmacion_venta'
  | 'devolucion_stock'
  | 'ajuste_cantidad'
  | 'confirmacion_pago'  // ← NUEVO

// Entidades
export interface Pago {
  id: string
  producto_id: string
  tela_id: string
  tipo_producto: TipoProducto
  medida: string | null
  monto: number
  fecha_pago: string
  nota: string | null
  usuario_id?: string | null
  created_at: string
  updated_at: string
}

// Inputs
export interface ConfirmarPagoInput {
  producto_id: string
  monto: number
  fecha_pago: string | Date
  nota?: string | null
}

// Dashboard
export interface PeriodoFilter {
  tipo: 'mes' | 'año' | 'todo' | 'custom'
  desde?: Date
  hasta?: Date
}
```

---

## 🧪 CHECKLIST MINI

### Antes de implementar
- [ ] Backup de BD
- [ ] Script SQL validado
- [ ] Entender cambio de flujo (VENDIDO → COBRADO)

### Durante TAREA 1
- [ ] Crear tabla `pagos` ✓
- [ ] Crear modal `ConfirmarPagoModal` ✓
- [ ] API POST `/api/pagos` ✓
- [ ] Botón "Confirmar pago" en RESERVADO ✓
- [ ] Estados cambían correctamente ✓
- [ ] Historial de movimientos registra `confirmacion_pago` ✓

### Durante TAREA 2
- [ ] Crear página `/dashboard` ✓
- [ ] Componentes KPI cards ✓
- [ ] Gráficos Recharts (barras + donut) ✓
- [ ] Tablas (top 10 + últimos pagos) ✓
- [ ] API endpoints dashboard ✓
- [ ] Selector de período funcional ✓
- [ ] Responsividad en mobile ✓

---

## 🎨 COLORES (Mantener Consistencia)

| Estado | Color | Hex | Badge Class |
|--------|-------|-----|------------|
| Stock | Verde | #16a34a | `bg-green-100 text-green-800` |
| Reservado | Ámbar | #ca8a04 | `bg-amber-100 text-amber-800` |
| Cobrado | Gris | #6b7280 | `bg-gray-100 text-gray-600` |
| Primary | Berry | #851919 | `bg-red-100 text-red-800` |

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile:  < 640px    → 2 KPI cols, gráficos apilados
Tablet:  640-1024   → 2 KPI cols, gráficos lado a lado
Desktop: > 1024     → 4 KPI cols, layout full
```

---

## 🔗 REFERENCIAS RÁPIDAS

**Next.js 14 App Router Pattern:**
```
src/app/(app)/dashboard/page.tsx     → Server Component
└─ src/components/dashboard/*        → Client Components
└─ src/hooks/useDashboard*           → Client-side fetching
```

**API Route:**
```
src/app/api/dashboard/stats/route.ts → Server function
├─ GET → fetchData()
└─ Supabase query
```

**Data Flow:**
```
Page.tsx (Server)
  ├─ Fetch initial data
  └─ Pass to Client Component
    └─ <DashboardStats stats={data} />
      └─ useEffect → refetch en cambio de período
```

---

## ⚠️ MIGRATION PATH (Producción)

```
1. Backup Supabase
2. Ejecutar script SQL en orden:
   a) ALTER TABLE productos ADD COLUMN precio_unitario
   b) CREATE TABLE pagos
   c) ALTER TYPE enum estados
   d) ALTER TABLE productos/movimientos
3. Deploy código (todas las ramas)
4. Validar en staging
5. Comunicar cambio de UX a usuarios
```

---

**Documento generado:** 20 Abril 2026  
**Para:** Claude - Implementación de TAREA 1 + TAREA 2
