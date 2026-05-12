-- ═══════════════════════════════════════════════════════════════
-- Clinch — Proposals Table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create table public.proposals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  client_id            uuid references public.clients(id) on delete set null,
  client_name          text not null,
  client_email         text,
  project_title        text not null,
  project_type         text,
  tone                 text default 'formal' check (tone in ('formal', 'friendly', 'bold')),
  input_job_description text,
  input_deliverables   text[] default '{}',
  input_budget         integer,  -- cents
  input_timeline       text,
  generated_content    jsonb,
  edited_content       jsonb,
  status               text default 'draft' check (status in ('draft', 'sent', 'viewed', 'won', 'lost')),
  amount               integer,  -- cents
  currency             text default 'usd',
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- RLS
alter table public.proposals enable row level security;

create policy "Users can view own proposals"
  on public.proposals for select
  using (auth.uid() = user_id);

create policy "Users can insert own proposals"
  on public.proposals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own proposals"
  on public.proposals for update
  using (auth.uid() = user_id);

create policy "Users can delete own proposals"
  on public.proposals for delete
  using (auth.uid() = user_id);

create index idx_proposals_user_id on public.proposals(user_id);
create index idx_proposals_status on public.proposals(user_id, status);
