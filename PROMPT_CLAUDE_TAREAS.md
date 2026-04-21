# 📌 PROMPT PARA CLAUDE - TAREA 1 + TAREA 2
**Copiar y pegar directamente**

---

```
CONTEXTO PROYECTO
=================
Aplicación Next.js 14 + Supabase + TypeScript para Berry Design (Argentina).
Stack: shadcn/ui, Tailwind CSS v4, SWR, Recharts.
Base de datos: PostgreSQL en Supabase con RLS habilitado.

ESTADO ACTUAL
=============
- Flujo de productos: EN STOCK → RESERVADO → VENDIDO (estado terminal)
- NO hay registro de pagos ni datos financieros
- 3 vistas principales: Inventario, Movimientos, Importar CSV
- Historial de cambios en tabla movimientos

PROBLEMA A RESOLVER
====================
1. El estado VENDIDO no diferencia entre promesa de venta y dinero efectivamente cobrado
2. No hay visibilidad de ganancias, rubros ganadores, ni análisis de ventas
3. Necesario intermediar RESERVADO → CONFIRMAR PAGO → COBRADO


═══════════════════════════════════════════════════════════════════════════════
TAREA 1: FLUJO DE PAGOS CON COBRO
═══════════════════════════════════════════════════════════════════════════════

REQUERIMIENTO FUNCIONAL
═══════════════════════════════════════════════════════════════════════════════

Flujo nuevo:
  EN STOCK → RESERVAR → RESERVADO → CONFIRMAR PAGO (modal) → COBRADO (final)
                    ↓
                DEVOLVER ↓
  EN STOCK ←─────────────

Butones:
  - Desde EN STOCK: "Reservar" (abre modal con cliente + nota)
  - Desde STOCK: "Vender" es ahora igual a "Reservar" (va a RESERVADO)
  - Desde RESERVADO: "Confirmar pago" (modal nuevo con monto + fecha + nota)
  - Desde RESERVADO: "Devolver" (vuelve a EN STOCK)
  - Desde COBRADO: "Ver detalle pago" (lectura)


CAMBIOS BASE DE DATOS
═══════════════════════════════════════════════════════════════════════════════

Tabla productos: AGREGAR
  precio_unitario DECIMAL(10,2) DEFAULT NULL

Cambiar ENUM:
  De: estado_producto = 'stock' | 'reservado' | 'vendido'
  A:  estado_producto = 'stock' | 'reservado' | 'cobrado'

Nueva tabla pagos:
  CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
    tela_id UUID NOT NULL REFERENCES telas(id),
    tipo_producto tipo_producto_mvp NOT NULL,
    medida TEXT,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT now(),
    nota TEXT,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago DESC);
  CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
  CREATE INDEX idx_pagos_producto ON pagos(producto_id);

Nuevo tipo de movimiento:
  'confirmacion_pago' (en enum tipo_movimiento)


ARCHIVOS EXISTENTES A MODIFICAR
═══════════════════════════════════════════════════════════════════════════════

1. src/types/producto.ts
   - Cambiar: export type EstadoProducto = 'stock' | 'reservado' | 'cobrado'
   - Agregar: export interface Pago { id, producto_id, monto, fecha_pago, nota, ... }
   - Agregar: TipoMovimiento incluya 'confirmacion_pago'
   - Actualizar: ESTADO_LABELS, ESTADO_COLORS (vendido → cobrado)

2. src/components/inventario/CardProducto.tsx
   - Botones en EN STOCK: "Reservar" y "Vender" ahora hacen lo mismo
   - Botones en RESERVADO: "Confirmar pago" (NUEVO) + "Devolver"
   - Botón en COBRADO: "Ver pago"

3. src/components/inventario/TablaProductos.tsx
   - Mismos cambios de botones que CardProducto
   - Condicionales: cambiar === 'vendido' por === 'cobrado'

4. src/lib/validations/producto.schema.ts
   - Agregar: confirmarPagoSchema con Zod (producto_id, monto, fecha_pago, nota)

5. src/hooks/useProductos.ts
   - Incluir precio_unitario en tipos
   - Cambiar filtros de estado: 'vendido' → 'cobrado'


ARCHIVOS NUEVOS A CREAR - TAREA 1
═══════════════════════════════════════════════════════════════════════════════

1. src/components/pagos/ConfirmarPagoModal.tsx
   Modal con campos:
   - Producto info (código, tipo, medida) - lectura
   - Monto ($) - input number, precompletado con producto.precio_unitario si existe
   - Fecha de pago - date picker, default hoy
   - Nota (opcional) - textarea max 500 chars
   - Botón confirmar (verde) / cancelar
   
   Lógica:
   - Validar monto > 0 y <= 999999.99
   - POST a /api/pagos
   - En success: cierra modal, recarga lista, toast confirmación
   - En error: muestra banner rojo

2. src/hooks/usePagos.ts
   Hook similar a useProductos pero para tabla pagos
   - GET /api/pagos con paginación
   - Retorna { pagos, total, hasMore, isLoading, mutate }

3. src/app/api/pagos/route.ts
   GET: Listar pagos (limit, offset, fecha_desde, fecha_hasta, usuario_id)
   POST: Crear pago
        Body: { producto_id, monto, fecha_pago, nota }
        Action: INSERT pagos + UPDATE productos (estado = cobrado) + INSERT movimientos
        Response: { id, producto_id, monto, ... }


═══════════════════════════════════════════════════════════════════════════════
TAREA 2: DASHBOARD FINANCIERO
═══════════════════════════════════════════════════════════════════════════════

UBICACIÓN Y SIDEBAR
═══════════════════════════════════════════════════════════════════════════════

Nueva ruta: /dashboard
Entrada en Sidebar (antes de "Inventario"):
  { label: 'Dashboard', href: '/dashboard', icon: Grid3x3, roles: ['admin', 'operador', 'consulta'] }


COMPONENTES DASHBOARD
═══════════════════════════════════════════════════════════════════════════════

1. PERIODO SELECTOR (Top-right)
   Select: "Este mes" / "Este año" / "Todo el tiempo" / "Rango personalizado"
   Rango personalizado abre dos date pickers (desde / hasta)
   Afecta TODOS los datos del dashboard en tiempo real

2. KPI CARDS (4 tarjetas en fila superior)
   
   Card 1: Total Cobrado
   - Icono: 💰
   - Valor: $47,350.00 (formateado ARS)
   - Subtexto: periodo seleccionado
   
   Card 2: Unidades Vendidas
   - Icono: 📦
   - Valor: 45 (COUNT DISTINCT productos en COBRADO)
   
   Card 3: Pagos Confirmados
   - Icono: ✓
   - Valor: "12 / 15" (12 cobrados, 15 reservados pendientes)
   
   Card 4: Rubro Ganador
   - Icono: 🏆
   - Nombre: "Matera"
   - Valor: "$18,500.00 (39%)"

3. GRAFICO: Ventas Mensuales (Barras - Recharts)
   - Eje X: Meses (Ene, Feb, Mar, ..., Dic)
   - Eje Y: Suma de montos por mes
   - Tooltip: "Marzo: $12,300.00"
   - Responsive: OK en mobile

4. GRAFICO: Ventas por Rubro (Donut - Recharts)
   - 4 segmentos: Matera, Porta anteojos, Cubre bidón, Alfombra vinílica
   - Leyenda lateral: nombre + porcentaje + monto
   - Colores: asignar por rubro (consistente)
   - innerRadius para efecto donut

5. TABLA: Top 10 Productos Más Vendidos
   Columnas: Código Tela | Tipo | Unidades | Monto Total | Barra de progreso
   - Ordenado por Monto Total DESC
   - Barra horizontal proporcional al máximo
   - Scrollable en mobile

6. TABLA: Últimos 10 Pagos Confirmados
   Columnas: Fecha | Código | Tipo | Monto | Nota
   - Ordenado por fecha DESC
   - Badge de color por estado/tipo
   - Última columna: botón "ver detalle"


ARCHIVOS NUEVOS - TAREA 2
═══════════════════════════════════════════════════════════════════════════════

Página:
- src/app/(app)/dashboard/page.tsx
  (Server component que fetcha datos iniciales, pasa a cliente)

Componentes:
- src/components/dashboard/DashboardStats.tsx (4 KPI cards)
- src/components/dashboard/VentasMonsualesChart.tsx (Recharts BarChart)
- src/components/dashboard/VentasPorRubroChart.tsx (Recharts PieChart)
- src/components/dashboard/TopProductosTable.tsx (tabla con barra progreso)
- src/components/dashboard/UltimosPagosTable.tsx (tabla últimos 10)
- src/components/dashboard/PeriodoSelector.tsx (select + date pickers)

Hooks:
- src/hooks/useDashboardStats.ts (fetch KPIs)
- src/hooks/useDashboardData.ts (fetch todos los datos en paralelo)

API Routes:
- src/app/api/dashboard/stats/route.ts
  GET ?fecha_desde=X&fecha_hasta=Y
  Response: { total_cobrado, unidades_vendidas, pagos_confirmados, pagos_pendientes, rubro_ganador }

- src/app/api/dashboard/ventas-mensuales/route.ts
  Response: [{ mes: 'Enero', total: 5200 }, ...]

- src/app/api/dashboard/por-rubro/route.ts
  Response: [{ rubro: 'matera', total: 18500, porcentaje: 39 }, ...]

- src/app/api/dashboard/top-productos/route.ts
  Response: [{ codigo_tela: '27/0001', tipo: 'matera', unidades: 8, total_cobrado: 4000, porcentaje: 25 }, ...]

- src/app/api/dashboard/ultimos-pagos/route.ts
  Response: [{ id, fecha_pago, codigo_tela, tipo, monto, nota, usuario }, ...]


═══════════════════════════════════════════════════════════════════════════════
INSTRUCCIONES GENERALES
═══════════════════════════════════════════════════════════════════════════════

1. NO MODIFICAR LÓGICA DE NEGOCIO EXISTENTE MÁS ALLÁ DE LO REQUERIDO
   - Solo cambiar flujo de estados (VENDIDO → COBRADO intermediando PAGO)
   - Mantener integridad de datos

2. USAR PATRONES EXISTENTES
   - Componentes: shadcn/ui + Radix UI (ya instalados)
   - Gráficos: Recharts (ya instalado)
   - API: Next.js Route Handlers con Supabase SDK
   - Hooks: SWR para fetching
   - Estilos: Tailwind CSS v4

3. RLS POLICIES
   - Tabla pagos: permitir lectura a todos authenticados
   - Insert: solo admin u operador (validar en backend)
   - Datos financieros: idealmente visibles a todos para transparencia

4. VALIDACIONES
   - Backend: Zod schemas
   - Frontend: Feedback visual en inputs

5. TESTING MANUAL POSTERIOR
   - Crear producto → Reservar → Confirmar pago → Verificar estado COBRADO
   - Dashboard: verificar KPIs, gráficos, tablas con datos reales
   - Período selector: cambiar périodos → datos actualizados

6. DOCUMENTACIÓN
   - Comentarios en código en secciones complejas
   - Types bien documentados
   - Sin cambios breaking en APIs públicas existentes


═══════════════════════════════════════════════════════════════════════════════
PRIORIDAD DE IMPLEMENTACIÓN
═══════════════════════════════════════════════════════════════════════════════

1. SQL Scripts (base de datos primero)
2. Tipos TypeScript (tipos son dependencia de todo)
3. TAREA 1 Completa (validación end-to-end)
4. TAREA 2 (depende de TAREA 1)


═══════════════════════════════════════════════════════════════════════════════
¿PROCEDER CON LA IMPLEMENTACIÓN COMPLETA?
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📋 TABLA PARA VALIDAR PROGRESO

Puedes usar esta tabla mientras implementas para trackear:

| Tarea | Archivo | Estado | Notas |
|-------|---------|--------|-------|
| **TAREA 1** | | | |
| DB | sql scripts | ⏳ | |
| Types | src/types/producto.ts | ⏳ | |
| CardProducto | CardProducto.tsx | ⏳ | |
| Modal Pago | ConfirmarPagoModal.tsx | 📝 | Crear nuevo |
| Hook Pagos | usePagos.ts | 📝 | Crear nuevo |
| API Pagos | api/pagos/route.ts | 📝 | Crear nuevo |
| **TAREA 2** | | | |
| Dashboard Page | dashboard/page.tsx | 📝 | Crear nuevo |
| KPI Stats | DashboardStats.tsx | 📝 | Crear nuevo |
| Ventas Chart | VentasMonsualesChart.tsx | 📝 | Crear nuevo |
| Rubro Chart | VentasPorRubroChart.tsx | 📝 | Crear nuevo |
| Top Productos | TopProductosTable.tsx | 📝 | Crear nuevo |
| Últimos Pagos | UltimosPagosTable.tsx | 📝 | Crear nuevo |
| API Stats | api/dashboard/stats/route.ts | 📝 | x5 endpoints |

Leyenda:
- ⏳ En progreso
- 📝 No comenzado
- ✅ Completado

---

## 🎯 RESUMEN EJECUTIVO

**Cambio Principal:** Flujo de productos intermediará un paso de confirmación de pago antes de marcarse como cobrado. Esto permite registrar datos financieros.

**Impacto en UX:** 
- Usuarios verán un paso extra (modal de pago) antes de marcar como vendido
- Ganancia: Vista de Dashboard con análisis de ventas y rubros

**Complejidad:** Media (nuevos componentes + nuevas API routes, sin refactoring masivo)

**Tiempo Estimado:** 4-6 horas (depende de testing)

---

**Documentos de referencia en el proyecto:**
- `ANALISIS_TAREA1_TAREA2.md` - Análisis exhaustivo (este archivo)
- `GUIA_RAPIDA_TAREAS.md` - Quick reference con tablas
- Este prompt - Lista de requerimientos (copia/pega a Claude)
