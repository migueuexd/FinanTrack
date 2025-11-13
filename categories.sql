-- Crear tabla de categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  type text not null check (type in ('income','expense')),
  color text not null default '#22c55e',
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name, type)
);

-- Índices
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists categories_type_idx on public.categories(type);

-- RLS
alter table public.categories enable row level security;

-- Políticas: cada usuario ve/gestiona solo sus categorías
-- Primero eliminamos las políticas si existen (por si ya existen)
drop policy if exists "select own" on public.categories;
drop policy if exists "insert own" on public.categories;
drop policy if exists "update own" on public.categories;
drop policy if exists "delete own" on public.categories;

-- Luego las creamos
create policy "select own" on public.categories
  for select using (auth.uid() = user_id);

create policy "insert own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "update own" on public.categories
  for update using (auth.uid() = user_id);

create policy "delete own" on public.categories
  for delete using (auth.uid() = user_id);

-- Actualizar tabla transactions para agregar category_id
alter table public.transactions 
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Índice para category_id
create index if not exists transactions_category_id_idx on public.transactions(category_id);

-- Función para actualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para actualizar updated_at automáticamente
drop trigger if exists update_categories_updated_at on public.categories;
create trigger update_categories_updated_at
  before update on public.categories
  for each row
  execute function update_updated_at_column();
