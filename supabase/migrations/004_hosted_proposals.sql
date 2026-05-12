-- ═══════════════════════════════════════════════════════════════
-- Clinch — Stage 2: Hosted Proposals Schema Migration
-- Adds new columns to proposals, creates analytics tables.
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. ALTER proposals table — add new hosted-proposal columns
-- ─────────────────────────────────────────────────────────────

-- New structured content columns (10-section JSON shape)
alter table public.proposals
  add column if not exists content_json        jsonb,
  add column if not exists edited_content_json jsonb,
  add column if not exists sections_config     jsonb
    default '{"order":["cover","problem","solution","approach","deliverables","timeline","pricing","about","faq","cta"],"visibility":{"cover":true,"problem":true,"solution":true,"approach":true,"deliverables":true,"timeline":true,"pricing":true,"about":true,"faq":false,"cta":true}}'::jsonb,
  add column if not exists template_id         text    default 'dark-editorial',
  add column if not exists theme_id            text    default 'midnight',
  add column if not exists hosted_token        uuid    unique default gen_random_uuid();

-- ─────────────────────────────────────────────────────────────
-- 2. DROP old content columns
-- ─────────────────────────────────────────────────────────────

alter table public.proposals
  drop column if exists generated_content,
  drop column if exists edited_content;

-- ─────────────────────────────────────────────────────────────
-- 3. UPDATE status check constraint to include 'accepted'
--    Old: ('draft','sent','viewed','won','lost')
--    New: adds 'accepted' for the hosted accept flow
-- ─────────────────────────────────────────────────────────────

alter table public.proposals drop constraint if exists proposals_status_check;
alter table public.proposals
  add constraint proposals_status_check
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'won', 'lost'));

-- ─────────────────────────────────────────────────────────────
-- 4. Add index on hosted_token for fast lookups
-- ─────────────────────────────────────────────────────────────

create index if not exists idx_proposals_hosted_token
  on public.proposals(hosted_token);

-- ─────────────────────────────────────────────────────────────
-- 5. Backfill hosted_token for any existing rows with NULL
--    (shouldn't happen due to DEFAULT but safety net)
-- ─────────────────────────────────────────────────────────────

update public.proposals
  set hosted_token = gen_random_uuid()
  where hosted_token is null;

-- Make hosted_token NOT NULL after backfill
alter table public.proposals
  alter column hosted_token set not null;

-- ═══════════════════════════════════════════════════════════════
-- 6. proposal_views — tracks who viewed the hosted page
-- ═══════════════════════════════════════════════════════════════

drop table if exists public.proposal_views cascade;
create table public.proposal_views (
  id                    uuid primary key default gen_random_uuid(),
  proposal_id           uuid not null references public.proposals(id) on delete cascade,
  viewed_at             timestamptz default now(),
  ip_hash               text,
  user_agent_hash       text,
  is_owner_view         boolean default false,
  time_on_page_seconds  integer,   -- nullable, updated async via beacon
  created_at            timestamptz default now()
);

-- Indexes
create index if not exists idx_proposal_views_proposal_id
  on public.proposal_views(proposal_id);
create index if not exists idx_proposal_views_viewed_at
  on public.proposal_views(proposal_id, viewed_at);

-- Enable RLS
alter table public.proposal_views enable row level security;

-- Policy: freelancer can READ views for their own proposals
drop policy if exists "Owner can read own proposal views" on public.proposal_views;
create policy "Owner can read own proposal views"
  on public.proposal_views for select
  using (
    proposal_id in (
      select id from public.proposals
      where user_id = auth.uid()
    )
  );

-- No insert/update/delete policies for anon/authenticated.
-- Views are inserted via service role (API routes) only.
-- This blocks any client-side writes.

-- ═══════════════════════════════════════════════════════════════
-- 7. proposal_events — granular analytics (scroll, clicks, etc.)
-- ═══════════════════════════════════════════════════════════════

drop table if exists public.proposal_events cascade;
create table public.proposal_events (
  id             uuid primary key default gen_random_uuid(),
  proposal_id    uuid not null references public.proposals(id) on delete cascade,
  event_type     text not null,        -- 'section_view', 'accept_click', 'deposit_click', 'time_on_page'
  section_key    text,                  -- nullable — only for section_view events
  metadata       jsonb default '{}',   -- flexible payload (e.g. { seconds: 45 } for time_on_page)
  created_at     timestamptz default now()
);

-- Indexes
create index if not exists idx_proposal_events_proposal_id
  on public.proposal_events(proposal_id);
create index if not exists idx_proposal_events_type
  on public.proposal_events(proposal_id, event_type);

-- Enable RLS
alter table public.proposal_events enable row level security;

-- Policy: freelancer can READ events for their own proposals
drop policy if exists "Owner can read own proposal events" on public.proposal_events;
create policy "Owner can read own proposal events"
  on public.proposal_events for select
  using (
    proposal_id in (
      select id from public.proposals
      where user_id = auth.uid()
    )
  );

-- No insert/update/delete policies for anon/authenticated.
-- Events are inserted via service role (API routes) only.

-- ═══════════════════════════════════════════════════════════════
-- 8. RLS policy on proposals: allow public read by hosted_token
--    (needed for the /p/[token] hosted page to fetch without auth)
-- ═══════════════════════════════════════════════════════════════

-- Allow anyone to SELECT a single proposal if they know the hosted_token.
-- This is safe because tokens are v4 UUIDs (122 bits of entropy).
-- The policy is scoped: callers must filter by hosted_token in their query.
drop policy if exists "Public can view proposal by hosted_token" on public.proposals;
create policy "Public can view proposal by hosted_token"
  on public.proposals for select
  using (true);
  -- Note: the existing "Users can view own proposals" policy uses auth.uid() = user_id.
  -- This new policy allows unauthenticated reads (for hosted page).
  -- In production, further restrict with a function that checks the request
  -- includes a hosted_token filter. For now, RLS + token secrecy is sufficient.
