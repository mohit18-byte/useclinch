-- ═══════════════════════════════════════════════════════════════
-- Clinch — Clients Table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  email      text,
  company    text,
  created_at timestamptz default now()
);

-- RLS
alter table public.clients enable row level security;

create policy "Users can view own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index idx_clients_user_id on public.clients(user_id);
