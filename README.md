This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuración de entorno

Crea un archivo `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## PWA

La PWA está configurada con `next-pwa`. En desarrollo se desactiva automáticamente; en producción se genera el Service Worker.

## Supabase: esquema SQL

Ejecuta esto en tu proyecto de Supabase (SQL Editor):

```sql
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),
  note text,
  occurred_at timestamptz not null default now(),
  inserted_at timestamptz not null default now()
);

-- Índices
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_occurred_at_idx on public.transactions(occurred_at desc);

-- RLS
alter table public.transactions enable row level security;

-- Políticas: cada usuario ve/gestiona solo sus registros
create policy if not exists "select own" on public.transactions
  for select using (auth.uid() = user_id);

create policy if not exists "insert own" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy if not exists "update own" on public.transactions
  for update using (auth.uid() = user_id);

create policy if not exists "delete own" on public.transactions
  for delete using (auth.uid() = user_id);
```

## Scripts

- `npm run dev`: inicia en `http://localhost:3000`
- `npm run build && npm start`: producción


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
