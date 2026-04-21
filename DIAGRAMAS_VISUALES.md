# 🎨 DIAGRAMAS VISUALES: TAREA 1 + TAREA 2

---

## 📊 DIAGRAMA 1: FLUJO DE ESTADOS (ANTES vs DESPUÉS)

### ❌ ANTES (Actual)

```
┌─────────────────────────────────────────────────────────────┐
│                FLUJO ACTUAL (A CAMBIAR)                    │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  EN STOCK    │
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
           ┌─────────────┐  ┌──────────┐
           │ Btn RESERVAR│  │ Btn VENDER
           └──────┬──────┘  └─────┬────┘
                  │               │
                  ▼               ▼
           ┌─────────────────────────┐
           │    RESERVADO            │
           │                         │
           ├─ Btn CONFIRMAR → VENDIDO◄─┐
           │                         │  └─ (SIN PAGO REGISTRADO)
           └─ Btn DEVOLVER → EN STOCK
                   (vuelve)

           VENDIDO es estado "final" pero sin dinero confirma do


PROBLEMA:
  ✗ No distingue entre promesa de venta y cobro real
  ✗ No hay registro de pagos
  ✗ Sin datos financieros para análisis
```

### ✅ DESPUÉS (Propuesto)

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO NUEVO (CON PAGOS)                       │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  EN STOCK    │
                    │              │
         Btn        │  Precio      │
       RESERVAR /   │  unitario?   │
       VENDER  ►────┤  $500        │
                    │              │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │   RESERVADO          │
                    │                      │
    ┌──────────────►│  Btn CONFIRMAR PAGO ◄──┐
    │               │  (abre Modal)        │  │
    │               │                      │  │
    │               │  Btn DEVOLVER ──────┘  │
    │               │  (vuelve a STOCK)      │
    │               └──────┬────────────────┘ │
    │                      │                  │
    │                      ▼                  │
    │          ┌──────────────────────┐      │
    │          │ MODAL:               │      │
    │          │ Confirmar Pago       │      │
    │          │                      │      │
    │          │ Monto: $500.00 ◄─────┼──┐  │
    │          │ Fecha: 20/04/2026   │  │  │
    │          │ Nota: Transferencia └──┤  │
    │          │                        │  │
    │          │ [Cancelar] [Confirmar] │  │
    │          └────┬──────────────┬─────┘  │
    │               │              │        │
    │          (error)       (success)      │
    │               │              │        │
    └───────────────┴──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   COBRADO    │
                    │ (FINAL)      │
                    │              │
         Btn        │  $500        │ ← Pago registrado
       "Ver Pago"   │  20/04/2026  │   en tabla pagos
       (lectura)    │  Usuario: JP │
                    │              │
                    └──────────────┘

VENTAJAS:
  ✓ Diferencia promesa de cobro
  ✓ Tabla pagos con datos financieros
  ✓ Habilita Dashboard
  ✓ Auditoria de dinero
```

---

## 🗂️ DIAGRAMA 2: ARQUITECTURA DE DATOS

### Tabla Anterior

```
PRODUCTOS
┌─────────────────────────────────────────┐
│ id   (UUID, PK)                         │
│ tela_id (FK → telas)                    │
│ tipo (ENUM: matera, porta_anteojos, ...) │
│ medida (TEXT nullable)                  │
│ cantidad (INT ≥ 0)                      │
│ estado (ENUM)                           │ ◄── Cambiar: 'vendido' → 'cobrado'
│ created_at, updated_at                  │
└─────────────────────────────────────────┘


MOVIMIENTOS
┌─────────────────────────────────────────┐
│ id, producto_id (FK)                    │
│ tipo_movimiento (ENUM)                  │ ◄── Agregar: 'confirmacion_pago'
│ estado_anterior, estado_nuevo (ENUM)    │
│ cantidad_delta, orden_bondarea, etc.    │
│ created_at                              │
└─────────────────────────────────────────┘
```

### Tabla Nueva + Cambios

```
PRODUCTOS (CAMBIOS)
┌─────────────────────────────────────────┐
│ ... (todo igual)                        │
│ estado (ENUM)                           │ ◄── Ahora: 'cobrado' (no 'vendido')
│ precio_unitario (DECIMAL nullable) ◄────┼─── AGREGAR
│ created_at, updated_at                  │
└─────────────────────────────────────────┘


PAGOS (NUEVA)                             ◄──────────────┐
┌──────────────────────────────────────────────────────┐│
│ id (UUID, PK)                                        ││
│ producto_id (UUID, FK → productos) UNIQUE           ││
│ tela_id (UUID, FK → telas)                          ││
│ tipo_producto (ENUM)                          ◄─────┼┼─ Desnormalizado para queries
│ medida (TEXT nullable)                        ◄─────┼┼─ más rápidas
│ monto (DECIMAL positivo) ◄─────────────────────────┐││
│ fecha_pago (TIMESTAMPTZ) ◄───────────────────────┐ │││
│ nota (TEXT) ◄──────────────────────────────────┐ │ │││
│ usuario_id (FK → usuarios)                     │ │ │││
│ created_at, updated_at                         │ │ │││
└──────────────────────────────────────────────────────┘│
                                                        │
Un pago por producto                                   │
(relación 1:1)                                         │
                                                   ◄───┘
MOVIMIENTOS (CAMBIOS)
┌──────────────────────────────────────────────────────┐
│ ... (todo igual)                                     │
│ tipo_movimiento (ENUM) ◄─── Ahora incluye:          │
│                        'confirmacion_pago'           │
│ ... (resto igual)                                    │
└──────────────────────────────────────────────────────┘
```

### Relaciones Visuales

```
telas (1) ─────┬─────── (M) productos
               │              │
               │              │ (1:1)
               │              │
               ├──────────────┼─── (1) pagos
               │              │
               └──────────────┘

movimientos referencia producto_id
movimientos nuevo tipo: confirmacion_pago
  ├─ estado_anterior: reservado
  └─ estado_nuevo: cobrado
    └─ coincide con INSERT en tabla pagos
```

---

## 🎯 DIAGRAMA 3: FLUJO DE USUARIO - TAREA 1

### Secuencia de acciones

```
Usuario abre /inventario
   │
   ▼
Ver producto en estado EN STOCK
   │
   ├─► Hace clic "Reservar"
   │      │
   │      ▼
   │   Modal "Registrar Reserva"
   │   ├─ Cliente: "Juan García"
   │   ├─ Orden: "ORD-2026-001"
   │   ├─ Nota: "Madera para cabaña"
   │   └─ [Confirmar]
   │      │
   │      ▼
   │   POST /api/movimientos
   │   ├─ tipo_movimiento: 'reserva'
   │   ├─ estado_nuevo: RESERVADO
   │   └─ Response ✓
   │      │
   │      ▼
   │   Producto ahora EN RESERVADO
   │   Toast: "Reserva confirmada"
   │
   │
   ├─► Hace clic "Confirmar pago"
   │      │
   │      ▼ ◄──── NUEVO FLUJO
   │   Modal "Confirmar Pago"
   │   ├─ Producto: 27/0001 | Matera
   │   ├─ Monto: $500.00 ◄─── Precompletado de precio_unitario
   │   ├─ Fecha: 20/04/2026 ◄─ Default hoy
   │   ├─ Nota: "Transferencia bancaria"
   │   └─ [Confirmar]
   │      │
   │      ▼
   │   POST /api/pagos
   │   ├─ producto_id: UUID
   │   ├─ monto: 500.00
   │   ├─ fecha_pago: ISO string
   │   └─ nota: "Transferencia"
   │      │
   │      ▼ (Backend hace transacción):
   │      ├─ INSERT pagos
   │      ├─ UPDATE productos SET estado = 'cobrado'
   │      ├─ INSERT movimientos (tipo: confirmacion_pago)
   │      └─ Response ✓
   │         │
   │         ▼
   │      Producto EN COBRADO
   │      Toast: "Pago confirmado"
   │      Vista actualizada
   │
   │
   └─► Hace clic "Ver producto"
        │
        ▼
     Detalle: estado COBRADO
     Muestra monto cobrado: $500
     Conocimiento: cliente cobró


Usuario abre /inventario nuevamente días después
   │
   ▼
Producto aún EN COBRADO (estado terminal)
   │
   └─► Botón "Ver pago" (opcional)
        │
        ▼
     Drawer con detalles:
     ├─ Monto: $500.00
     ├─ Fecha: 20/04/2026 14:30
     ├─ Usuario: Juan Pérez (quien registró)
     ├─ Nota: "Transferencia"
     └─ [Cerrar]
```

---

## 📊 DIAGRAMA 4: DASHBOARD - DISEÑO LAYOUT

```
┌─ HEADER ──────────────────────────────────────────────────────┐
│ Dashboard    [Período: Este mes ▼]  [Desde ▼] [Hasta ▼]       │
└───────────────────────────────────────────────────────────────┘

┌─ KPI SECTION ─────────────────────────────────────────────────┐
│                                                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │  💰         │ │ 📦          │ │ ✓           │ │ 🏆      │ │
│ │ Total       │ │ Unidades    │ │ Confirmados │ │ Rubro   │ │
│ │ $47,350     │ │ 45          │ │ 12/15       │ │ Matera  │ │
│ │             │ │             │ │             │ │ $18.5K  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ GRAFICOS ─────────────────────────────────────────────────────┐
│                                                                │
│  ┌────────────────────────────────┬──────────────────────────┐ │
│  │ Ventas Mensuales (Barras)      │ Ventas por Rubro (Donut)│ │
│  │                                │                         │ │
│  │   $   │                         │      ╱────╲            │ │
│  │  $12K u   ║                     │    ╱  ●    ╲           │ │
│  │  $10K │   ║  ║        ║        │   │   39%   │           │ │
│  │  $8K  │   ║  ║  ║  ║  ║  ║     │   │ Matera  │           │ │
│  │  $6K  │   ║  ║  ║  ║  ║  ║  ║  │    ╲  ●  ╱            │ │
│  │  $4K  │   ║  ║  ║  ║  ║  ║  ║ ║     ╲────╱             │ │
│  │  $2K  u   ║──╫──╫──╫──╫──╫──╫─┼      Legend:            │ │
│  │  $0   └───────────────────────┼──────────────            │ │
│  │        Ene Feb Mar Apr May Jun │ Porta: 26%              │ │
│  │                                │ Cubre:  17%             │ │
│  │                                │ Alfomr: 18%             │ │
│  └────────────────────────────────┴──────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ TABLA: TOP 10 ────────────────────────────────────────────────┐
│ Código │ Tipo│ Unidades │ Monto  │ %                           │
│ 27/001 │ Mat │ 8        │ $4.0K  │ ████████░░ 25%             │
│ 23/002 │ Por │ 6        │ $2.1K  │ ██████░░░░ 13%             │
│ 30/015 │ Alf │ 5        │ $1.7K  │ ██░░░░░░░░ 11%             │
│ ...    │ ... │ ...      │ ...    │ ...                         │
└────────────────────────────────────────────────────────────────┘

┌─ TABLA: ULTIMOS PAGOS ─────────────────────────────────────────┐
│ Fecha   │ Código │ Tipo │ Monto │ Nota             │ Usuario   │
│ 20/04   │ 27/001 │ Mat  │ $500  │ Transferencia    │ J. Pérez  │
│ 19/04   │ 23/002 │ Por  │ $300  │ Efectivo         │ M. García │
│ ...     │ ...    │ ...  │ ...   │ ...              │ ...       │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DIAGRAMA 5: FLUJO DE DATOS - TAREA 2

### Carga inicial de datos

```
usuario accede /dashboard
   │
   ▼
next.js server component
   │
   ├─► fetch('/api/dashboard/stats?fecha_desde=...&fecha_hasta=...')
   │      ├─ Supabase query KPIs
   │      └─ Response: { total_cobrado, unidades_vendidas, ... }
   │
   ├─► fetch('/api/dashboard/ventas-mensuales?...')
   │      ├─ Supabase query DATE_TRUNC
   │      └─ Response: [{ mes, total }, ...]
   │
   ├─► fetch('/api/dashboard/por-rubro?...')
   │      ├─ GROUP BY tipo_producto
   │      └─ Response: [{ rubro, total, porcentaje }, ...]
   │
   ├─► fetch('/api/dashboard/top-productos?...')
   │      ├─ JOIN telas, GROUP, ORDER BY monto DESC LIMIT 10
   │      └─ Response: [{ codigo, tipo, unidades, total }, ...]
   │
   └─► fetch('/api/dashboard/ultimos-pagos?...')
          ├─ ORDER BY fecha DESC LIMIT 10
          └─ Response: [{ id, fecha, codigo, tipo, monto }, ...]

             ▼ (todo paralelo, no secuencial)

   Componente Cliente recibe todos los datos
   │
   ├─► <DashboardStats stats={data} />
   ├─► <VentasMonsualesChart data={data} />  (Recharts)
   ├─► <VentasPorRubroChart data={data} />  (Recharts)
   ├─► <TopProductosTable data={data} />
   └─► <UltimosPagosTable data={data} />

             ▼

   Renderiza todo en pantalla
   │
   └─► Estado: isLoading = false, error = null
```

### Cambio de período

```
Usuario selecciona "Este año" en selector
   │
   ▼
evento: onPeriodoChange({ tipo: 'año', desde: '2026-01-01', hasta: '2026-12-31' })
   │
   ▼
hook: useDashboardData(periodo) re-ejecuta fetch
   │
   ├─► Todas las queries se re-ejecutan con nuevas fechas
   ├─► isLoading = true (durante refetch)
   └─► Response actualizado
      │
      ▼
   Componentes re-renden con nuevos datos
   │
   ▼
   Gráficos se animan y actualizan
   Tablas muestran otros productos/pagos
```

---

## 📱 DIAGRAMA 6: RESPONSIVIDAD

### Desktop (> 1024px)

```
┌──────────────────────────────────────────┐
│ Dashboard              [Período ▼]       │
├──────────────────────────────────────────┤
│ ┌──── KPI 1 ┐ ┌──── KPI 2 ┐├──── KPI 3 ┐ ┌──── KPI 4 ┐
│ │   Cobrado  │ │ Unidades  ││Confirmad │ │ Rubro    │
│ │   $47,350  │ │    45     ││   12/15  │ │ Matera   │
│ └───────────┘ └───────────┘└──────────┘ └──────────┘
│ ┌────────────────────────┐ ┌────────────────────────┐
│ │   Ventas Mensuales     │ │  Por Rubro (donut)     │
│ │ (Gráfico de barras)    │ │ (Gráfico donut)        │
│ └────────────────────────┘ └────────────────────────┘
│ ┌──────────────────────────────────────────────────┐
│ │ Top 10 (tabla con scroll)                        │
│ └──────────────────────────────────────────────────┘
│ ┌──────────────────────────────────────────────────┐
│ │ Últimos Pagos (tabla)                           │
│ └──────────────────────────────────────────────────┘
└──────────────────────────────────────────┘
```

### Tablet (640-1024px)

```
┌────────────────────────────────────────┐
│ Dashboard    [Período ▼]               │
├────────────────────────────────────────┤
│ ┌─── KPI 1 ─┐ ┌─── KPI 2 ──┐         │
│ │  Cobrado   │ │  Unidades  │         │
│ │  $47,350   │ │    45      │         │
│ └────────────┘ └────────────┘         │
│ ┌─── KPI 3 ─┐ ┌─── KPI 4 ──┐         │
│ │Confirmado  │ │  Rubro     │         │
│ │  12/15     │ │  Matera    │         │
│ └────────────┘ └────────────┘         │
│ ┌──────────────────────────────────────┐ │
│ │     Ventas Mensuales (barras)        │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │    Por Rubro (donut)                 │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Top 10 (tabla scroll horiz)          │ │
│ └──────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Mobile (< 640px)

```
┌──────────────────────────┐
│ Dashboard [Período ▼]    │ (selector en drawer?)
├──────────────────────────┤
│ ┌────── KPI 1 ──────┐   │
│ │   Cobrado         │   │
│ │   $47,350         │   │
│ └───────────────────┘   │
│ ┌────── KPI 2 ──────┐   │
│ │   Unidades        │   │
│ │   45              │   │
│ └───────────────────┘   │
│ ┌────── KPI 3 ──────┐   │
│ │   Confirmad       │   │
│ │   12/15           │   │
│ └───────────────────┘   │
│ ┌────── KPI 4 ──────┐   │
│ │   Rubro           │   │
│ │   Matera          │   │
│ └───────────────────┘   │
│                          │
│ ┌──── Gráfico ─────┐    │
│ │ Ventas (rotado   │    │ ← Gráficos más compactos
│ │  90° o scroll)   │    │
│ └──────────────────┘    │
│ ┌──── Gráfico ─────┐    │
│ │ Rubros (donut)   │    │
│ └──────────────────┘    │
│ ┌──────────────────┐    │
│ │ Tablas (scroll   │    │
│ │ horizontal)      │    │
│ └──────────────────┘    │
└──────────────────────────┘
```

---

## 🗄️ DIAGRAMA 7: ESTRUCTURA DE CARPETAS

### Después de implementación completa

```
src/
├── app/
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx ◄─────────────────── NUEVO
│   │   ├── inventario/
│   │   │   ├── page.tsx (modificado)
│   │   │   ├── [id]/
│   │   │   └── [id]/editar/
│   │   ├── movimientos/
│   │   ├── importar/
│   │   └── admin/
│   │
│   ├── api/
│   │   ├── pagos/
│   │   │   └── route.ts ◄─────────────────── NUEVO
│   │   ├── dashboard/
│   │   │   ├── stats/
│   │   │   │   └── route.ts ◄───────────── NUEVO x5
│   │   │   ├── ventas-mensuales/
│   │   │   │   └── route.ts
│   │   │   ├── por-rubro/
│   │   │   │   └── route.ts
│   │   │   ├── top-productos/
│   │   │   │   └── route.ts
│   │   │   └── ultimos-pagos/
│   │   │       └── route.ts
│   │   ├── productos/ (modificado)
│   │   ├── movimientos/ (modificado)
│   │   └── ...
│   │
│   └── layout.tsx, page.tsx, etc.
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardStats.tsx ◄─────────── NUEVO
│   │   ├── VentasMonsualesChart.tsx ◄──── NUEVO
│   │   ├── VentasPorRubroChart.tsx ◄───── NUEVO
│   │   ├── TopProductosTable.tsx ◄─────── NUEVO
│   │   ├── UltimosPagosTable.tsx ◄─────── NUEVO
│   │   └── PeriodoSelector.tsx ◄────────── NUEVO
│   │
│   ├── pagos/
│   │   ├── ConfirmarPagoModal.tsx ◄────── NUEVO
│   │   └── PagoDetalleDrawer.tsx ◄─────── NUEVO (opcional)
│   │
│   ├── inventario/
│   │   ├── CardProducto.tsx (modificado)
│   │   ├── TablaProductos.tsx (modificado)
│   │   └── ...
│   │
│   ├── movimientos/
│   │   ├── FormMovimiento.tsx (modificado)
│   │   └── ...
│   │
│   ├── layout/ (modificado Sidebar)
│   └── ui/ (sin cambios)
│
├── hooks/
│   ├── useDashboardStats.ts ◄──────────── NUEVO
│   ├── useDashboardData.ts ◄───────────── NUEVO
│   ├── usePagos.ts ◄─────────────────── NUEVO
│   ├── useProductos.ts (modificado)
│   └── ...
│
├── types/
│   └── producto.ts (modificado: + Pago, + tipos dashboard)
│
├── lib/
│   └── validations/
│       └── producto.schema.ts (modificado + Zod schemas nuevos)
│
└── sql/
    ├── 001_schema.sql (modificado + tabla pagos)
    ├── 002_configurabilidad.sql (modificado estados)
    └── 003_seed_... (sin cambios)
```

---

## 🔗 DIAGRAMA 8: DEPENDENCIAS ENTRE ARCHIVOS

### TAREA 1

```
sql scripts (DB changes)
    │
    ▼
types/producto.ts ◄─────────────────── Todos dependen
    │
    ├─► components/inventario/CardProducto.tsx
    ├─► components/inventario/TablaProductos.tsx
    ├─► components/pagos/ConfirmarPagoModal.tsx ◄─── NUEVO
    │       ▼
    │   hooks/usePagos.ts ◄────────────────────── NUEVO
    │       ▼
    │   app/api/pagos/route.ts ◄────────────── NUEVO
    │
    ├─► lib/validations/producto.schema.ts
    │
    └─► hooks/useProductos.ts
```

### TAREA 2

```
types/producto.ts (tipos nuevos dashboard)
    │
    ├─► components/dashboard/*
    │       ├─ DashboardStats.tsx
    │       ├─ VentasMonsualesChart.tsx (Recharts)
    │       ├─ VentasPorRubroChart.tsx (Recharts)
    │       ├─ TopProductosTable.tsx
    │       ├─ UltimosPagosTable.tsx
    │       └─ PeriodoSelector.tsx
    │          │
    │          ▼
    │   hooks/useDashboardData.ts
    │   hooks/useDashboardStats.ts
    │       │
    │       ▼
    │   app/api/dashboard/*
    │       ├─ stats/route.ts
    │       ├─ ventas-mensuales/route.ts
    │       ├─ por-rubro/route.ts
    │       ├─ top-productos/route.ts
    │       └─ ultimos-pagos/route.ts
    │
    └─► app/(app)/dashboard/page.tsx ◄─── NUEVO: integra todo
```

---

## ✅ DIAGRAMA 9: TESTING PATH

### Happy Path - TAREA 1

```
1. Crear producto
   POST /api/productos
   ├─ estado: 'stock'
   └─ precio_unitario: 500

2.  Producto aparece en /inventario
   ├─ En grid/tabla
   └─ Con botones: "Reservar", "Vender"

3. Hacer click "Reservar"
   ├─ Se abre Modal FormMovimiento
   ├─ Ingreso datos cliente
   └─ [Confirmar]
        │
        ▼
        POST /api/movimientos (tipo: 'reserva')
        ├─ cambio estado a RESERVADO
        └─ ✓ movimiento registrado

4. En inventario, producto ve aparece ahora con RESERVADO
   ├─ Botones cambiaron a:
   │  ├─ "Confirmar pago"
   │  └─ "Devolver"
   │
   └─ Hacer click "Confirmar pago"
        │
        ▼
        Se abre Modal ConfirmarPagoModal
        ├─ Código: 27/0001, Tipo: Matera
        ├─ Monto: $500.00 (precompletado)
        ├─ Fecha: 20/04/2026 (hoy)
        ├─ Nota: "Transferencia"
        └─ [Confirmar]
            │
            ▼
            POST /api/pagos
            ├─ INSERT pagos
            ├─ UPDATE productos (estado = COBRADO)
            ├─ INSERT movimientos (tipo: confirmacion_pago)
            └─ ✓ pago registrado

5. Producto ahora en estado COBRADO
   ├─ Badge: "Cobrado" (gris)
   ├─ Botón: "Ver pago"
   ├─ Toast: "Pago confirmado"
   └─ ✓ TEST PASSED

6. En /api/pagos GET, aparece el registro
   ├─ producto_id: UUID
   ├─ monto: 500.00
   ├─ fecha_pago: ISO string
   └─ ✓ BD correcta
```

### Happy Path - TAREA 2

```
1. Crear al menos 3 productos con estado COBRADO
   ├─ Diferentes rubrosa
   └─ Diferentes montos

2. Acceder a /dashboard
   └─ Página carga sin errores

3. Ver KPI Cards
   ├─ Total cobrado: suma correcta ✓
   ├─ Unidades vendidas: count correcto ✓
   ├─ Confirmados: 3 / 0 ✓
   └─ Rubro ganador: correcto ✓

4. Gráfico Ventas Mensuales
   ├─ Aparece barra este mes ✓
   ├─ Altura proporcional al monto ✓
   └─ Tooltip funciona ✓

5. Gráfico Por Rubro
   ├─ 3 segmentos visibles ✓
   ├─ Leyenda con porcentajes correctos ✓
   └─ Colores asignados ✓

6. Tabla Top 10
   ├─ 3 filas (los productos) ✓
   ├─ Ordenado por monto DESC ✓
   └─ Barra de progreso visible ✓

7. Tabla Últimos Pagos
   ├─ 3 filas ✓
   ├─ Datos correctos ✓
   └─ Ordenado por fecha DESC ✓

8. Cambiar período a "Este año"
   ├─ Todos los datos se actualizan ✓
   ├─ No hay errores en console ✓
   └─ Gráficos se animan ✓

9. Responsividad mobile
   ├─ KPI cards en 2 columnas ✓
   ├─ Gráficos apilados ✓
   ├─ Tablas con scroll horizontal ✓
   └─ ✓ TEST PASSED
```

---

**Fin de Diagramas Visuales**

Estos diagramas ayudan a:
- Comprender el flujo global
- Visualizar cambios de estado
- Ver estructura de archivos
- Entender dependencias
- Validar funcionamiento

---
