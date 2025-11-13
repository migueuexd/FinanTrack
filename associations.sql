-- Crear tabla de asociaciones
create table if not exists public.associations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Índices
create index if not exists associations_name_idx on public.associations(name);

-- RLS
alter table public.associations enable row level security;

-- Políticas: todos pueden ver las asociaciones (solo nombre para el registro)
drop policy if exists "select associations" on public.associations;
create policy "select associations" on public.associations
  for select using (true);

-- Solo usuarios autenticados pueden crear asociaciones
drop policy if exists "insert associations" on public.associations;
create policy "insert associations" on public.associations
  for insert with check (auth.uid() is not null);

-- Crear tabla de usuarios en asociaciones
create table if not exists public.user_associations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  association_id uuid not null references public.associations(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique(user_id, association_id)
);

-- Índices
create index if not exists user_associations_user_id_idx on public.user_associations(user_id);
create index if not exists user_associations_association_id_idx on public.user_associations(association_id);

-- RLS
alter table public.user_associations enable row level security;

-- Políticas: usuarios solo ven sus propias asociaciones
drop policy if exists "select own associations" on public.user_associations;
create policy "select own associations" on public.user_associations
  for select using (auth.uid() = user_id);

-- Usuarios pueden unirse a asociaciones
drop policy if exists "insert own associations" on public.user_associations;
create policy "insert own associations" on public.user_associations
  for insert with check (auth.uid() = user_id);

-- Actualizar tabla transactions para soportar asociaciones
-- Las transacciones pueden ser personales (user_id) o de asociación (association_id)
alter table public.transactions 
  add column if not exists association_id uuid references public.associations(id) on delete cascade;

-- Índice para association_id
create index if not exists transactions_association_id_idx on public.transactions(association_id);

-- Actualizar política de transacciones para incluir asociaciones
-- Los usuarios ven sus transacciones personales y las de sus asociaciones
drop policy if exists "select own" on public.transactions;
create policy "select own" on public.transactions
  for select using (
    user_id = auth.uid() 
    OR association_id IN (
      select association_id 
      from public.user_associations 
      where user_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar transacciones personales o de sus asociaciones
drop policy if exists "insert own" on public.transactions;
create policy "insert own" on public.transactions
  for insert with check (
    user_id = auth.uid() 
    AND (
      association_id IS NULL 
      OR association_id IN (
        select association_id 
        from public.user_associations 
        where user_id = auth.uid()
      )
    )
  );

-- Los usuarios pueden actualizar transacciones personales o de sus asociaciones
drop policy if exists "update own" on public.transactions;
create policy "update own" on public.transactions
  for update using (
    user_id = auth.uid() 
    OR association_id IN (
      select association_id 
      from public.user_associations 
      where user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar transacciones personales o de sus asociaciones
drop policy if exists "delete own" on public.transactions;
create policy "delete own" on public.transactions
  for delete using (
    user_id = auth.uid() 
    OR association_id IN (
      select association_id 
      from public.user_associations 
      where user_id = auth.uid()
    )
  );

-- Función para hashear contraseñas (usaremos crypt de pgcrypto)
-- Necesitamos habilitar la extensión si no está habilitada
create extension if not exists pgcrypto;

-- Función helper para verificar contraseña de asociación
create or replace function verify_association_password(assoc_name text, pass text)
returns uuid as $$
declare
  assoc_id uuid;
begin
  select id into assoc_id
  from public.associations
  where name = assoc_name and password_hash = crypt(pass, password_hash);
  return assoc_id;
end;
$$ language plpgsql security definer;

-- Función para crear asociación con hash de contraseña
create or replace function create_association(p_name text, p_password text, p_created_by uuid)
returns uuid as $$
declare
  assoc_id uuid;
  hashed_password text;
begin
  -- Hashear la contraseña
  hashed_password := crypt(p_password, gen_salt('bf'));
  
  -- Crear la asociación
  insert into public.associations (name, password_hash, created_by)
  values (p_name, hashed_password, p_created_by)
  returning id into assoc_id;
  
  return assoc_id;
end;
$$ language plpgsql security definer;

-- Función para unirse a una asociación (verifica contraseña y crea el vínculo)
-- Esta función permite que un usuario se una a una asociación incluso si no está completamente autenticado en la sesión
create or replace function join_association(p_assoc_name text, p_password text, p_display_name text, p_user_id uuid)
returns uuid as $$
declare
  assoc_id uuid;
  user_assoc_id uuid;
begin
  -- Verificar que el usuario existe
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuario no encontrado';
  end if;
  
  -- Verificar contraseña
  select id into assoc_id
  from public.associations
  where name = p_assoc_name and password_hash = crypt(p_password, password_hash);
  
  if assoc_id is null then
    raise exception 'Nombre de asociación o contraseña incorrectos';
  end if;
  
  -- Crear vínculo (security definer permite bypassear RLS)
  insert into public.user_associations (user_id, association_id, display_name)
  values (p_user_id, assoc_id, p_display_name)
  on conflict (user_id, association_id) do update
  set display_name = excluded.display_name
  returning id into user_assoc_id;
  
  return assoc_id;
end;
$$ language plpgsql security definer;

-- Función para obtener los display_names de los miembros de una asociación
-- Solo funciona si el usuario actual también pertenece a esa asociación
create or replace function get_association_members(p_association_id uuid)
returns table(user_id uuid, display_name text) as $$
begin
  -- Verificar que el usuario actual pertenece a esta asociación
  if not exists (
    select 1 
    from public.user_associations 
    where association_id = p_association_id 
    and user_id = auth.uid()
  ) then
    raise exception 'No tienes acceso a esta asociación';
  end if;
  
  -- Retornar todos los miembros de la asociación
  return query
  select ua.user_id, ua.display_name
  from public.user_associations ua
  where ua.association_id = p_association_id;
end;
$$ language plpgsql security definer;

-- Función para obtener transacciones con display_names incluidos
-- Esta función bypassea RLS usando security definer
create or replace function get_transactions_with_users()
returns table(
  id uuid,
  type text,
  amount numeric,
  note text,
  occurred_at timestamptz,
  category_id uuid,
  association_id uuid,
  user_id uuid,
  user_display_name text,
  category_name text,
  category_color text,
  association_name text
) as $$
declare
  current_user_id uuid;
  user_association_ids uuid[];
begin
  current_user_id := auth.uid();
  
  -- Obtener las asociaciones del usuario actual
  select array_agg(association_id) into user_association_ids
  from public.user_associations
  where user_id = current_user_id;
  
  -- Si no tiene asociaciones, user_association_ids será null
  if user_association_ids is null then
    user_association_ids := array[]::uuid[];
  end if;
  
  return query
  select 
    t.id,
    t.type,
    t.amount,
    t.note,
    t.occurred_at,
    t.category_id,
    t.association_id,
    t.user_id,
    case 
      when t.association_id is not null and t.association_id = any(user_association_ids) then
        (select ua2.display_name 
         from public.user_associations ua2 
         where ua2.user_id = t.user_id 
         and ua2.association_id = t.association_id
         limit 1)
      else null
    end as user_display_name,
    c.name as category_name,
    c.color as category_color,
    a.name as association_name
  from public.transactions t
  left join public.categories c on c.id = t.category_id and c.user_id = current_user_id
  left join public.associations a on a.id = t.association_id
  where 
    t.user_id = current_user_id
    or (t.association_id is not null and t.association_id = any(user_association_ids))
  order by t.occurred_at desc;
end;
$$ language plpgsql security definer;

-- Dar permisos para ejecutar las funciones RPC
grant execute on function verify_association_password(text, text) to authenticated, anon;
grant execute on function create_association(text, text, uuid) to authenticated;
grant execute on function join_association(text, text, text, uuid) to authenticated, anon;
grant execute on function get_association_members(uuid) to authenticated;
grant execute on function get_transactions_with_users() to authenticated;

