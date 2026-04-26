# 🔍 Auditoría Técnico-Funcional — Berry Design Stock Manager

---

## 1. 🧩 FUNCIONALIDADES FALTANTES (Feature Gaps)

---

### 🔴 Upload real de fotos de tela
**Por qué:** El campo `foto_url` solo acepta una URL externa. La dueña viene de WhatsApp — saca fotos con el celular. Pegar una URL de imagen no es un flujo que vaya a usar. Sin fotos visibles, el inventario en grid es una grilla de íconos grises sin valor visual.
**Prioridad:** Alta
**Notas:** Supabase Storage ya está en el stack. Implementar upload directo desde el formulario de creación de producto y desde la edición de tela. Bucket `fotos-telas`, acceso público.

---

### 🔴 Inconsistencia crítica de enums: `vendido` vs `cobrado`
**Por qué:** El schema SQL define el enum `estado_producto` con `'vendido'`, pero el código TypeScript usa `'cobrado'`. Esto produce errores silenciosos en runtime — la app escribe `cobrado` en la DB pero la DB espera `vendido`. Si las migraciones posteriores lo corrigieron, hay que verificarlo y sincronizarlo. Si no, es un bug activo.
**Prioridad:** Alta (bug, no feature)
**Notas:** Revisar 004_tarea1_pagos.sql. Unificar en un solo término en DB y código. Lo más descriptivo para el negocio es `cobrado`.

---

### 🔴 El importer de Bondarea espera un CSV custom, no el real de Bondarea
**Por qué:** El parser en `bondarea/parser.ts` espera columnas como `orden_bondarea`, `codigo_tela`, `tipo`, `medida` — un formato que no es el que Bondarea exporta realmente. El CSV real de Bondarea tiene columnas de e-commerce (producto, SKU, estado del pedido, cliente, dirección). El mapeo entre el CSV real y el modelo de la app no existe.
**Prioridad:** Alta
**Notas:** Necesitás el CSV real de Bondarea para mapear columnas. Sin esto el módulo de importación no puede usarse con datos reales.

---

### 🔴 Stock mínimo y alertas
**Por qué:** La dueña necesita saber "esta tela está por agotarse" sin tener que revisar producto por producto. Sin alertas, el sistema es reactivo: se entera cuando ya se quedó sin stock.
**Prioridad:** Alta
**Notas:** Agregar campo `stock_minimo` en la tabla `productos`. Banner/badge en el inventario cuando `cantidad <= stock_minimo`. Panel en dashboard con productos en alerta.

---

### 🔴 Vista "¿Cuántas unidades puedo fabricar hoy?"
**Por qué:** Esta es LA pregunta operativa del negocio. La dueña tiene X metros de tela 27/0001 y necesita saber cuántos productos terminados puede hacer. El sistema actual trackea productos terminados en stock, no tela en bruto. Son dos niveles distintos.
**Prioridad:** Alta
**Notas:** Decisión de modelo abierta (ver sección 3): ¿la app trackea metros de tela o solo productos terminados? Si solo trackea productos terminados, esta pregunta no tiene respuesta en el sistema.

---

### 🟡 Alta masiva de productos por lote de tela
**Por qué:** Cuando llega un nuevo rollo de tela, la dueña probablemente quiere crear Matera + Porta Anteojos + Cubre Bidón para esa tela en un solo paso, no en 3 formularios separados.
**Prioridad:** Media
**Notas:** Formulario "Nuevo lote de tela": ingresás el código de tela, la foto, y checkboxes para qué productos va a generar (con cantidad para cada uno). Un POST crea N productos de una vez.

---

### 🟡 Historial por tela (vista 360° de una tela)
**Por qué:** La dueña quiere ver "todo lo que pasó con la tela 27/0001": qué productos se hicieron, cuántos se vendieron, cuántos quedan. Hoy esa vista no existe.
**Prioridad:** Media
**Notas:** Página `/telas/[codigo]` que agrupe todos los productos de esa tela y su historial de movimientos.

---

### 🟡 Gestión de Catálogos como entidad visible
**Por qué:** La tabla `catalogos` existe en el schema y las telas tienen `catalogo_id`, pero no hay ninguna UI para crear o asignar catálogos. Esto significa que ese campo siempre es null.
**Prioridad:** Media
**Notas:** Agregar sección en `/admin/configuracion` o un módulo propio. Permite organizar las telas por temporada/colección.

---

### 🟡 Edición de precio unitario desde el inventario
**Por qué:** El campo `precio_unitario` aparece en el tipo TypeScript y en las cards, pero no hay forma de editarlo masivamente ni desde el listado. El formulario de nuevo producto no lo incluye.
**Prioridad:** Media
**Notas:** Agregar campo precio en la edición de producto. Considerar si el precio es por producto o por tela.

---

### 🟡 Cancelación de reserva con liberación de stock
**Por qué:** Una reserva cancelada debe devolver el producto a `stock`. El flujo "Devolver" existe en el código, pero no está claro si el cliente sabe que ese es el camino, ni si hay una forma de buscar reservas pendientes para cancelarlas.
**Prioridad:** Media
**Notas:** Vista filtrada de "Reservados" con acción rápida de "Cancelar reserva". Registro del motivo de cancelación en el movimiento.

---

### 🟢 Paginación en movimientos
**Por qué:** El historial de movimientos va a crecer indefinidamente. Hoy carga todos o un número fijo. En 6 meses habrá miles de registros.
**Prioridad:** Baja (pero se convierte en alta con el tiempo)
**Notas:** Mismo patrón de `loadMore` que ya existe en inventario.

---

### 🟢 Exportar movimientos / pagos a Excel
**Por qué:** La dueña va a querer llevar registros a su contador. Hoy solo se puede exportar el inventario.
**Prioridad:** Baja
**Notas:** Mismo patrón que `/api/exportar` ya implementado, aplicado a movimientos y pagos con filtros de fecha.

---

## 2. 🖥️ USABILIDAD Y UX

---

### 🔴 El sidebar fijo de 240px rompe en mobile
La app no es responsive. El sidebar ocupa el 100% del ancho en pantallas chicas y el contenido queda oculto. La dueña va a usar esto desde el celular cuando esté en el taller o en la calle. Si la app no funciona en mobile, no va a ser adoptada.
**Recomendación:** Sidebar colapsable con hamburger en mobile. Patrón estándar, no requiere rediseño.

---

### 🔴 Crear un producto tiene demasiados pasos para el caso de uso más común
El formulario de "Nuevo producto" tiene 2 pasos y requiere conocer el código de tela. El caso de uso más frecuente es "llegó un lote nuevo, quiero darlo de alta rápido". El flujo actual no está diseñado para velocidad.
**Recomendación:** Flujo de alta rápida: código de tela + foto (upload directo) + tipo + cantidad. Todo en una pantalla, sin wizard.

---

### 🔴 El carrito agrega complejidad innecesaria para el MVP
Existe un `CarritoContext` y `CarritoPanel` con lógica de carrito multiproducto. Para el modelo de negocio actual (ventas de 1-3 productos por transacción, sin e-commerce), este nivel de complejidad puede confundir a la usuaria y agregar fricción al flujo más común.
**Recomendación:** Evaluar si el carrito aporta valor real en el día a día. Si la mayoría de las ventas son de 1 producto, el flujo directo Reservar→Vender es más intuitivo.

---

### 🟡 La búsqueda en inventario no filtra por nombre de producto
El filtro de búsqueda busca por `telas.codigo` (ej: "27/0001"). Pero si la usuaria escribe "matera" o "verde", no encuentra nada. El código de tela es un identificador técnico, no un nombre que el cliente recuerde.
**Recomendación:** Búsqueda que incluya también `observaciones` de la tela y el nombre del tipo de producto.

---

### 🟡 Los estados en la card no tienen acción contextual clara
Cuando un producto está en estado `cobrado`, la card muestra "Cobrado" sin ninguna acción. Si la dueña quiere ver el detalle de esa venta, no hay un link directo desde el inventario al movimiento correspondiente.
**Recomendación:** Botón "Ver historial" en cards de productos cobrados. Link desde el movimiento al producto.

---

### 🟡 El módulo de Movimientos es difícil de escanear
El timeline muestra todos los movimientos juntos. Para la dueña, lo importante es "¿qué pasó con este producto específico?" o "¿cuánto cobré hoy?". El filtro por tipo es útil pero el filtro por producto/cliente no existe.
**Recomendación:** Agregar filtro por código de tela y búsqueda por cliente en la pantalla de movimientos.

---

### 🟢 El dashboard es financiero, no operativo
El dashboard actual muestra KPIs de ventas y facturación. Está bien para análisis, pero la dueña probablemente empieza el día necesitando saber el estado operativo: cuántos productos en stock, cuántas reservas pendientes, qué hay por agotarse. Esa vista no existe.
**Recomendación:** Sección "Estado operativo de hoy" encima de los KPIs financieros.

---

## 3. 📋 ANÁLISIS DE REQUERIMIENTOS — Ambigüedades y Riesgos

---

### 🔴 Pregunta crítica sin responder: ¿el sistema trackea tela en bruto o solo productos terminados?
Este es el gap conceptual más importante. Hay dos modelos posibles:

**Modelo A (actual):** Stock de productos terminados. Ejemplo: hay 5 materas de tela 27/0001. La dueña da de alta el producto cuando ya está fabricado.

**Modelo B (futuro):** Stock de metros de tela. La app calcula cuántos productos se pueden fabricar según los metros disponibles y el consumo por unidad.

El Modelo A es el implementado. El Modelo B es más poderoso pero requiere un rediseño del schema. Si el cliente asume Modelo B, hay una brecha enorme.

**Pregunta para el cliente:** ¿Cuándo registrás un producto en el sistema? ¿Cuando comprás la tela o cuando el producto ya está terminado y listo para vender?

---

### 🔴 ¿Los códigos de tela de productos Home/Mantas comparten la serie numérica con los actuales?
El código `27/0001` sugiere una serie específica. Si los nuevos rubros usan códigos de otra serie, el modelo de datos actual funciona. Si comparten la misma serie pero con significado diferente según el rubro, hay ambigüedad en las búsquedas.
**Pregunta para el cliente:** ¿Podés mostrarme un código de tela de una alfombra y uno de una matera? ¿Son del mismo "universo"?

---

### 🟡 ¿El precio es por producto o por tela?
El campo `precio_unitario` está en la tabla `productos`. Esto implica que el mismo código de tela puede tener precio diferente según si es matera o porta anteojos. ¿Es ese el modelo real del negocio?
**Pregunta para el cliente:** Si tenés la tela 27/0001 y hacés una matera y un porta anteojos con ella, ¿tienen el mismo precio o diferente?

---

### 🟡 ¿Una venta puede incluir múltiples productos de telas distintas?
El carrito sugiere que sí. Pero el modelo de `pagos` actual tiene `producto_id` (singular). Una venta multi-producto requeriría una tabla `lineas_de_venta` o similar.
**Pregunta para el cliente:** ¿Alguna vez una clienta te compra 2 productos de telas distintas en la misma transacción?

---

### 🟡 ¿Quién usa el sistema además de la dueña?
Hay 3 roles (admin, operador, consulta). ¿Hay empleados reales que van a usar la app como operadores? ¿O la dueña es la única usuaria activa?
**Importancia:** Afecta decisiones de UX (complejidad vs. simplicidad) y de seguridad.

---

### 🟢 ¿Qué pasa con el stock histórico ya existente?
Antes de la app, la dueña tenía stock en Google Drive/WhatsApp. ¿Hay un proceso de migración de datos históricos? ¿O se arranca desde cero?
**Importancia:** Si hay datos históricos, la tabla `importaciones_bondarea` no es suficiente para ingresarlos.

---

## 4. 🔄 FLUJOS OPERATIVOS NO CUBIERTOS

---

### 🔴 Flujo: Llegó una nueva tela → Dar de alta al sistema
**Estado actual:** La dueña va a `/productos/nuevo`, ingresa el código de tela manualmente, elige el tipo, agrega cantidad. Si quiere hacer Matera + Porta Anteojos de esa tela, repite el proceso 2 veces más.
**Flujo ideal:** Formulario de "Ingreso de nuevo lote de tela" donde elige los tipos de producto que va a hacer con esa tela, la cantidad de cada uno, y sube la foto. Se crean N productos en un solo paso.

---

### 🔴 Flujo: Llega un pedido de Bondarea → Registrar en el sistema
**Estado actual:** El módulo de importación existe pero espera un CSV con columnas custom. El CSV real de Bondarea tiene otro formato. El paso de transformación manual es un punto de falla y fricción enorme.
**Flujo ideal:** Subir el CSV tal como lo exporta Bondarea, y que la app lo entienda directamente.

---

### 🟡 Flujo: Una reserva vence o se cancela → ¿Qué pasa con el stock?
No hay concepto de "reserva con fecha de vencimiento". Una reserva puede quedar así indefinidamente. No hay vista de "reservas pendientes" ni forma de cancelarlas en batch.
**Flujo ideal:** Lista de reservas activas con fecha de reserva. Posibilidad de cancelar y devolver al stock con un clic.

---

### 🟡 Flujo: La dueña quiere saber el estado general del negocio en 30 segundos
**Estado actual:** Tiene el dashboard con KPIs financieros. No hay un resumen operativo rápido.
**Flujo ideal:** Pantalla inicial con 4 números grandes: Total en stock / Reservados / Vendidos este mes / Productos con stock bajo.

---

### 🟢 Flujo: Un cliente paga a través de Mercado Pago o transferencia → ¿Cómo se registra?
El campo `metodo_pago` acepta efectivo/transferencia/tarjeta. No hay integración con MP ni forma de verificar el pago automáticamente. Es manual, lo cual está bien para el MVP, pero hay que aclararlo.

---

## 5. 📊 REPORTES Y VISIBILIDAD DEL NEGOCIO

---

### 🔴 Panel de stock crítico
Lista de productos donde `cantidad <= stock_minimo`. Ordenado por urgencia. Esto no existe hoy.

### 🔴 Stock disponible por rubro en tiempo real
"Cuántas materas tengo en stock" de un vistazo. Hoy el StatsInventario muestra totales de estado pero no por tipo de producto.

### 🟡 Telas más vendidas vs. telas con stock parado
Qué telas generan más ventas y cuáles están en stock hace tiempo sin moverse. Permite tomar decisiones de producción.

### 🟡 Ventas por canal (Bondarea vs. venta directa)
Las ventas importadas desde Bondarea tienen `orden_bondarea`. Las directas no. Se puede derivar el canal de este campo. Reporte que muestre el split Bondarea vs. venta directa.

### 🟡 Ratio reservado/disponible por tipo de producto
¿Qué % de las materas están reservadas vs. disponibles? Indica demanda real.

### 🟢 Facturación mensual vs. mes anterior
El dashboard actual tiene ventas mensuales. Falta la comparación % vs. mes anterior.

---

## 6. 🔗 INTEGRACIÓN CON BONDAREA (vía CSV)

---

### 🔴 El mapeo de columnas no existe para el CSV real de Bondarea
El parser actual espera columnas diseñadas por el desarrollador. Bondarea es un sistema de gestión de pedidos para e-commerce argentino — su CSV exportado tiene estructura propia.

**Lo que se necesita antes de implementar:**
Obtener un CSV real de exportación de Bondarea de la dueña y mapear cada columna al modelo de la app.

**Flujo que debería funcionar:**
1. Dueña exporta pedidos desde Bondarea (tal cual, sin modificar)
2. Sube el archivo en `/importar`
3. La app muestra una vista previa con los pedidos detectados y advertencias
4. Confirma → se crean los movimientos de `reserva` para cada línea

**Validaciones críticas:**
- ¿El producto (tela + tipo) existe en el inventario? → Error si no existe
- ¿El producto tiene stock suficiente? → Advertencia
- ¿El número de orden ya fue importado? → Bloquear duplicado
- ¿El tipo de producto en Bondarea matchea con el enum interno? → Normalización

**Pregunta abierta:** ¿El SKU en Bondarea incluye el código de tela? ¿O solo el nombre del producto? Esta respuesta define si la integración es viable o requiere un mapeo manual por producto.

---

## 7. ⚠️ RIESGOS TÉCNICOS Y FUNCIONALES

---

### 🔴 Enum inconsistente `vendido` vs `cobrado` puede corromper datos
El schema SQL define `'vendido'` y el código TypeScript usa `'cobrado'`. Si la migración 004 no resolvió esto completamente, hay registros en la DB con valor incorrecto o errores en las transiciones de estado. Necesita verificación inmediata.

### 🔴 La búsqueda por `ilike 'telas.codigo'` en PostgREST puede no funcionar
En Supabase PostgREST, filtrar en una relación con `ilike` desde la tabla padre no es directo. El código en `lib/db/productos.ts` hace `query.ilike('telas.codigo', ...)` pero el operador `ilike` sobre un join en PostgREST requiere sintaxis específica. Puede devolver resultados incorrectos o vacíos sin mostrar error.

### 🔴 Adopción — si el sistema no funciona en mobile, no será usado
La dueña opera en un entorno no-de-escritorio. Si el primer día intenta usarlo en el celular y ve que no funciona, abandona la herramienta.

### 🟡 Modelo de datos no contempla stock de tela en bruto
Si el negocio crece y la dueña quiere trackear metros de tela comprados vs. consumidos, el schema actual no lo soporta sin una migración significativa.

### 🟡 El carrito no persiste entre sesiones
El `CarritoContext` usa estado de React. Si la dueña cierra el browser con un carrito a medio completar, se pierde.

### 🟡 Sin índice unique en `orden_bondarea`
El schema tiene `create index` sobre `orden_bondarea` pero no un `unique constraint`. Importar el mismo CSV dos veces crea movimientos duplicados sin error.

### 🟢 La política RLS de `usuarios` puede causar problemas al crear un nuevo usuario
Un usuario recién registrado tiene `rol = consulta`. Requiere testing de que el admin puede verlo y editarlo correctamente.

---

## 8. 🗺️ ROADMAP SUGERIDO

---

### Fase 1 — MVP Sólido (antes de entrega al cliente)

1. **Fix enum `vendido`/`cobrado`** — bug activo, prioridad máxima
2. **Upload de fotos** — sin fotos el inventario visual no tiene valor
3. **Mobile responsive** — sidebar colapsable, layouts fluidos
4. **Fix búsqueda en inventario** — que realmente funcione
5. **Unique constraint en `orden_bondarea`** — evitar duplicados
6. **Obtener CSV real de Bondarea y validar el parser** — sin esto el módulo de importación no sirve
7. **Stock mínimo + badge de alerta** — crítico para operaciones
8. **Panel "Estado operativo"** en dashboard — sustituto del whiteboard/WhatsApp que usaba

---

### Fase 2 — Valor Agregado (primera iteración post-entrega)

1. Alta masiva de productos por lote de tela
2. Vista 360° por tela (`/telas/[codigo]`)
3. Lista de reservas activas con cancelación rápida
4. Filtro por producto/cliente en movimientos
5. Gestión de catálogos de tela (UI para la tabla que ya existe)
6. Exportación de movimientos/pagos a Excel
7. Historial de precio por producto

---

### Fase 3 — Escalabilidad (cuando la operativa esté estabilizada)

1. Integración real con CSV de Bondarea (mapeo de columnas reales)
2. Trackeo de tela en bruto (metros comprados vs. consumidos) — si se confirma el requisito
3. Reportes avanzados: telas más vendidas, stock parado, ratio reservado/disponible
4. Persistencia del carrito
5. Notificaciones de stock bajo (email o push)
6. API pública o webhooks si Bondarea eventualmente lo habilita

---

## 📌 RESUMEN EJECUTIVO — 5 Recomendaciones Urgentes

1. **🔴 Verificar y resolver el enum `cobrado` vs `vendido`** — puede haber datos corruptos en producción. Es el riesgo técnico más inmediato.

2. **🔴 Obtener el CSV real de Bondarea y rediseñar el parser** — el módulo de importación actualmente no puede usarse con datos reales. Es el feature más importante para el flujo operativo del cliente.

3. **🔴 Hacer la app responsive para mobile** — si no funciona en celular, no será adoptada. La dueña no es una usuaria de escritorio.

4. **🔴 Implementar upload real de fotos a Supabase Storage** — sin fotos, el inventario visual pierde todo su valor y el formulario de nuevo producto queda incompleto para un usuario no técnico.

5. **🟡 Resolver la pregunta de modelo: ¿trackea tela en bruto o solo productos terminados?** — esta decisión afecta el schema y si no se resuelve antes de la Fase 2, cualquier feature de producción que se construya puede quedar obsoleto.
