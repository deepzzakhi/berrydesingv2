-- ════════════════════════════════════════════════════════════════════════════
-- Berry Stock - Módulo de Configurabilidad
-- ════════════════════════════════════════════════════════════════════════════

-- ── tipos_producto ────────────────────────────────────────────────────────────
-- Reemplaza el enum hardcodeado en UI. El enum de Postgres se mantiene por
-- compatibilidad; esta tabla agrega gestión dinámica desde el admin.

create table if not exists tipos_producto (
  id              uuid primary key default uuid_generate_v4(),
  codigo          text not null unique,
  nombre          text not null,
  requiere_medida boolean not null default false,
  activo          boolean not null default true,
  orden           integer not null default 0,
  created_at      timestamptz not null default now()
);

insert into tipos_producto (codigo, nombre, requiere_medida, orden) values
  ('matera',            'Matera',             false, 1),
  ('porta_anteojos',    'Porta Anteojos',     false, 2),
  ('cubre_bidon',       'Cubre Bidón',        false, 3),
  ('alfombra_vinilica', 'Alfombra Vinílica',  true,  4)
on conflict (codigo) do nothing;

-- ── estados_producto ──────────────────────────────────────────────────────────

create table if not exists estados_producto_config (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text not null unique,
  nombre       text not null,
  color        text not null default '#6b7280',
  badge_class  text not null default 'bg-gray-100 text-gray-600 border-gray-200',
  es_terminal  boolean not null default false,
  transiciones text[] not null default '{}',
  activo       boolean not null default true,
  orden        integer not null default 0,
  created_at   timestamptz not null default now()
);

insert into estados_producto_config (codigo, nombre, color, badge_class, es_terminal, transiciones, orden) values
  ('stock',     'En Stock',  '#16a34a', 'bg-green-100 text-green-800 border-green-200', false, '{"reservado","vendido"}', 1),
  ('reservado', 'Reservado', '#ca8a04', 'bg-amber-100 text-amber-800 border-amber-200', false, '{"vendido","stock"}',     2),
  ('vendido',   'Vendido',   '#6b7280', 'bg-gray-100 text-gray-600 border-gray-200',    true,  '{}',                     3)
on conflict (codigo) do nothing;

-- ── configuracion_sistema ─────────────────────────────────────────────────────

create table if not exists configuracion_sistema (
  clave       text primary key,
  valor       jsonb not null,
  descripcion text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references usuarios(id) on delete set null
);

insert into configuracion_sistema (clave, valor, descripcion) values
  ('stock_minimo_alerta',   '5',     'Cantidad mínima antes de mostrar alerta de stock bajo'),
  ('max_reservas_por_lote', '100',   'Máximo de reservas permitidas por importación'),
  ('importar_crea_producto','true',  'Si el producto no existe al importar, crearlo automáticamente'),
  ('importar_en_error',     '"skip"','Comportamiento ante errores de importación: skip | abort')
on conflict (clave) do nothing;

-- ── auditoria ─────────────────────────────────────────────────────────────────

create table if not exists auditoria (
  id         uuid primary key default uuid_generate_v4(),
  usuario_id uuid references usuarios(id) on delete set null,
  accion     text not null,
  entidad    text not null,
  entidad_id text,
  datos_antes jsonb,
  datos_despues jsonb,
  ip         text,
  created_at timestamptz not null default now()
);

create index if not exists idx_auditoria_usuario on auditoria (usuario_id);
create index if not exists idx_auditoria_entidad on auditoria (entidad, entidad_id);
create index if not exists idx_auditoria_created on auditoria (created_at desc);

-- ── RLS para tablas nuevas ────────────────────────────────────────────────────

alter table tipos_producto enable row level security;
alter table estados_producto_config enable row level security;
alter table configuracion_sistema enable row level security;
alter table auditoria enable row level security;

-- tipos_producto: todos leen, solo admin escribe
create policy "tipos_select" on tipos_producto
  for select to authenticated using (true);

create policy "tipos_write" on tipos_producto
  for all to authenticated
  using (get_my_rol() = 'admin')
  with check (get_my_rol() = 'admin');

-- estados: todos leen, solo admin escribe
create policy "estados_select" on estados_producto_config
  for select to authenticated using (true);

create policy "estados_write" on estados_producto_config
  for all to authenticated
  using (get_my_rol() = 'admin')
  with check (get_my_rol() = 'admin');

-- config sistema: solo admin
create policy "config_select" on configuracion_sistema
  for select to authenticated
  using (get_my_rol() = 'admin');

create policy "config_write" on configuracion_sistema
  for all to authenticated
  using (get_my_rol() = 'admin')
  with check (get_my_rol() = 'admin');

-- auditoria: admin y operador leen, insert via service
create policy "auditoria_select" on auditoria
  for select to authenticated
  using (get_my_rol() in ('admin', 'operador'));

create policy "auditoria_insert" on auditoria
  for insert to authenticated
  with check (get_my_rol() in ('admin', 'operador'));

-- ── super_admin al rol enum ───────────────────────────────────────────────────
-- Ejecutar solo si querés agregar super_admin:
-- alter type rol_usuario add value if not exists 'super_admin';
