-- ════════════════════════════════════════════════════════════════════════════
-- Berry Stock - Esquema principal
-- Berry Design · Argentina
-- ════════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type tipo_producto_mvp as enum (
  'matera',
  'porta_anteojos',
  'cubre_bidon',
  'alfombra_vinilica'
);

create type estado_producto as enum (
  'stock',
  'reservado',
  'vendido'
);

create type tipo_movimiento as enum (
  'ingreso_stock',
  'reserva',
  'confirmacion_venta',
  'devolucion_stock',
  'ajuste_cantidad'
);

create type rol_usuario as enum (
  'admin',
  'operador',
  'consulta'
);

-- ── Catalogos ─────────────────────────────────────────────────────────────────

create table if not exists catalogos (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  temporada    text,
  descripcion  text,
  created_at   timestamptz not null default now()
);

comment on table catalogos is 'Catálogos de telas de Berry Design';

-- ── Telas ─────────────────────────────────────────────────────────────────────

create table if not exists telas (
  id             uuid primary key default uuid_generate_v4(),
  codigo         text not null unique,          -- Ej: "27/0001"
  foto_url       text,
  observaciones  text,
  catalogo_id    uuid references catalogos(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table telas is 'Telas identificadas por código único';
comment on column telas.codigo is 'Código de tela, formato NN/NNNN, ej: 27/0001';

create index if not exists idx_telas_codigo on telas (codigo);
create index if not exists idx_telas_catalogo on telas (catalogo_id);

-- ── Productos ─────────────────────────────────────────────────────────────────

create table if not exists productos (
  id          uuid primary key default uuid_generate_v4(),
  tela_id     uuid not null references telas(id) on delete cascade,
  tipo        tipo_producto_mvp not null,
  medida      text,               -- Solo requerido para alfombra_vinilica
  cantidad    integer not null default 0 check (cantidad >= 0),
  estado      estado_producto not null default 'stock',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Clave compuesta: misma tela + tipo + medida es un único producto
  constraint uq_producto_tela_tipo_medida unique (tela_id, tipo, medida)
);

comment on table productos is 'Unidades de stock identificadas por (tela + tipo + medida)';
comment on constraint uq_producto_tela_tipo_medida on productos
  is 'Una tela + tipo + medida = una única línea de stock';

create index if not exists idx_productos_tela on productos (tela_id);
create index if not exists idx_productos_estado on productos (estado);
create index if not exists idx_productos_tipo on productos (tipo);

-- ── Usuarios ──────────────────────────────────────────────────────────────────

create table if not exists usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nombre      text,
  rol         rol_usuario not null default 'consulta',
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table usuarios is 'Perfil extendido de usuarios (vinculado a auth.users)';

create index if not exists idx_usuarios_email on usuarios (email);
create index if not exists idx_usuarios_rol on usuarios (rol);

-- ── Movimientos ───────────────────────────────────────────────────────────────

create table if not exists movimientos (
  id               uuid primary key default uuid_generate_v4(),
  producto_id      uuid not null references productos(id) on delete cascade,
  tipo_movimiento  tipo_movimiento not null,
  estado_anterior  estado_producto,
  estado_nuevo     estado_producto not null,
  cantidad_delta   integer not null default 0,
  orden_bondarea   text,
  cliente          text,
  usuario_id       uuid references usuarios(id) on delete set null,
  notas            text,
  created_at       timestamptz not null default now()
);

comment on table movimientos is 'Historial de todos los cambios de estado/cantidad de los productos';

create index if not exists idx_movimientos_producto on movimientos (producto_id);
create index if not exists idx_movimientos_tipo on movimientos (tipo_movimiento);
create index if not exists idx_movimientos_created on movimientos (created_at desc);
create index if not exists idx_movimientos_orden on movimientos (orden_bondarea)
  where orden_bondarea is not null;

-- ── Importaciones Bondarea ────────────────────────────────────────────────────

create table if not exists importaciones_bondarea (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid references usuarios(id) on delete set null,
  nombre_archivo  text,
  total_filas     integer not null default 0,
  filas_importadas integer not null default 0,
  filas_error     integer not null default 0,
  errores_detalle jsonb,
  created_at      timestamptz not null default now()
);

comment on table importaciones_bondarea is 'Registro de cada importación CSV desde Bondarea';

-- ── Updated_at trigger ────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger telas_updated_at
  before update on telas
  for each row execute function set_updated_at();

create trigger productos_updated_at
  before update on productos
  for each row execute function set_updated_at();

create trigger usuarios_updated_at
  before update on usuarios
  for each row execute function set_updated_at();

-- ── Auto-create usuario on signup ─────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'consulta'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── registrar_movimiento RPC ──────────────────────────────────────────────────
-- Función central que aplica cambios de estado y registra el movimiento
-- en una sola transacción.

create or replace function registrar_movimiento(
  p_producto_id    uuid,
  p_tipo_movimiento tipo_movimiento,
  p_cantidad_delta integer default 0,
  p_orden_bondarea text default null,
  p_cliente        text default null,
  p_usuario_id     uuid default null,
  p_notas          text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_producto          productos%rowtype;
  v_estado_anterior   estado_producto;
  v_estado_nuevo      estado_producto;
  v_nueva_cantidad    integer;
  v_movimiento_id     uuid;
begin
  -- Lock the product row for update
  select * into v_producto
  from productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'Producto no encontrado: %', p_producto_id;
  end if;

  v_estado_anterior := v_producto.estado;
  v_estado_nuevo    := v_producto.estado;
  v_nueva_cantidad  := v_producto.cantidad;

  -- Apply state transitions based on movement type
  case p_tipo_movimiento
    when 'ingreso_stock' then
      v_estado_nuevo   := 'stock';
      v_nueva_cantidad := v_producto.cantidad + coalesce(p_cantidad_delta, 0);

    when 'reserva' then
      if v_producto.estado != 'stock' then
        raise exception 'Solo se pueden reservar productos en estado "stock". Estado actual: %', v_producto.estado;
      end if;
      v_estado_nuevo := 'reservado';

    when 'confirmacion_venta' then
      if v_producto.estado not in ('stock', 'reservado') then
        raise exception 'Solo se pueden vender productos en estado "stock" o "reservado". Estado actual: %', v_producto.estado;
      end if;
      v_estado_nuevo   := 'vendido';
      v_nueva_cantidad := greatest(0, v_producto.cantidad - coalesce(p_cantidad_delta, 1));

    when 'devolucion_stock' then
      v_estado_nuevo   := 'stock';
      v_nueva_cantidad := v_producto.cantidad + coalesce(p_cantidad_delta, 0);

    when 'ajuste_cantidad' then
      v_nueva_cantidad := greatest(0, v_producto.cantidad + coalesce(p_cantidad_delta, 0));
      -- Estado doesn't change for adjustments

    else
      raise exception 'Tipo de movimiento no reconocido: %', p_tipo_movimiento;
  end case;

  -- Update the product
  update productos
  set
    estado     = v_estado_nuevo,
    cantidad   = v_nueva_cantidad,
    updated_at = now()
  where id = p_producto_id;

  -- Record the movement
  insert into movimientos (
    producto_id,
    tipo_movimiento,
    estado_anterior,
    estado_nuevo,
    cantidad_delta,
    orden_bondarea,
    cliente,
    usuario_id,
    notas
  )
  values (
    p_producto_id,
    p_tipo_movimiento,
    v_estado_anterior,
    v_estado_nuevo,
    coalesce(p_cantidad_delta, 0),
    p_orden_bondarea,
    p_cliente,
    p_usuario_id,
    p_notas
  )
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table catalogos enable row level security;
alter table telas enable row level security;
alter table productos enable row level security;
alter table movimientos enable row level security;
alter table usuarios enable row level security;
alter table importaciones_bondarea enable row level security;

-- Catalogos: all authenticated users can read, only admin/operador can write
create policy "catalogos_select" on catalogos
  for select to authenticated using (true);

create policy "catalogos_insert" on catalogos
  for insert to authenticated
  with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

create policy "catalogos_update" on catalogos
  for update to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

-- Telas: all authenticated can read, operadores+ can write
create policy "telas_select" on telas
  for select to authenticated using (true);

create policy "telas_write" on telas
  for all to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  )
  with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

-- Productos: all authenticated can read, operadores+ can write
create policy "productos_select" on productos
  for select to authenticated using (true);

create policy "productos_write" on productos
  for all to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  )
  with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

-- Movimientos: all authenticated can read, insert allowed for operadores+
create policy "movimientos_select" on movimientos
  for select to authenticated using (true);

create policy "movimientos_insert" on movimientos
  for insert to authenticated
  with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

-- Usuarios: each user can see their own row, admins can see all
create policy "usuarios_select_own" on usuarios
  for select to authenticated
  using (id = auth.uid());

create policy "usuarios_select_admin" on usuarios
  for select to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol = 'admin' and activo = true
    )
  );

create policy "usuarios_update_own" on usuarios
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "usuarios_update_admin" on usuarios
  for update to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol = 'admin' and activo = true
    )
  );

-- Importaciones: operadores+ can read/write
create policy "importaciones_select" on importaciones_bondarea
  for select to authenticated
  using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

create policy "importaciones_insert" on importaciones_bondarea
  for insert to authenticated
  with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and rol in ('admin', 'operador') and activo = true
    )
  );

-- ── Datos de ejemplo ─────────────────────────────────────────────────────────
-- (Descomentar para seed inicial)

-- insert into catalogos (nombre, temporada, descripcion)
-- values ('Catálogo Otoño 2024', '2024 Otoño', 'Primera colección de la temporada');

-- insert into telas (codigo, foto_url, observaciones, catalogo_id)
-- values
--   ('27/0001', null, 'Tela de algodón estampada', (select id from catalogos limit 1)),
--   ('27/0002', null, 'Tela de lino natural', (select id from catalogos limit 1));

-- insert into productos (tela_id, tipo, medida, cantidad, estado)
-- values
--   ((select id from telas where codigo = '27/0001'), 'matera', null, 5, 'stock'),
--   ((select id from telas where codigo = '27/0001'), 'porta_anteojos', null, 3, 'stock'),
--   ((select id from telas where codigo = '27/0002'), 'alfombra_vinilica', '120x180cm', 2, 'stock');
