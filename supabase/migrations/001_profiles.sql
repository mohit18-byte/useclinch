-- ═══════════════════════════════════════════════════════════════
-- Clinch — Profiles Table + Auth Trigger
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the profiles table
create table public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  full_name                text,
  bio                      text,
  services                 text[] default '{}',
  hourly_rate              integer,  -- stored in cents
  logo_url                 text,
  brand_color              text default '#5e6ad2',
  onboarding_completed     boolean default false,
  stripe_customer_id       text,
  stripe_connect_account_id text,
  stripe_connect_onboarded boolean default false,
  subscription_tier        text default 'free' check (subscription_tier in ('free', 'pro', 'agency')),
  subscription_status      text default 'active',
  proposals_this_month     integer default 0,
  proposals_month_reset    date,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS policies — users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Proposal counter function (atomic check + increment)
create or replace function public.check_and_increment_proposal_count(
  p_user_id uuid,
  p_limit integer
)
returns table(allowed boolean, current_count integer)
language plpgsql
security definer
as $$
declare
  v_month_reset date;
  v_count integer;
  v_first_of_month date := date_trunc('month', current_date)::date;
begin
  -- Lock the row
  select proposals_month_reset, proposals_this_month
    into v_month_reset, v_count
    from public.profiles
    where id = p_user_id
    for update;

  -- Reset if new month
  if v_month_reset is null or v_month_reset < v_first_of_month then
    v_count := 0;
    update public.profiles
      set proposals_this_month = 0,
          proposals_month_reset = v_first_of_month
      where id = p_user_id;
  end if;

  -- Check limit
  if v_count >= p_limit then
    return query select false, v_count;
    return;
  end if;

  -- Increment
  update public.profiles
    set proposals_this_month = v_count + 1,
        updated_at = now()
    where id = p_user_id;

  return query select true, v_count + 1;
end;
$$;
