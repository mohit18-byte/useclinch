-- ═══════════════════════════════════════════════════════════════
-- Clinch — Stage 2 Verification Script
-- Run this AFTER applying 004_hosted_proposals.sql
-- Tests all new columns, constraints, and RLS policies.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- TEST 1: Verify new columns exist on proposals
-- ─────────────────────────────────────────────────────────────
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'proposals'
  and column_name in (
    'content_json', 'edited_content_json', 'sections_config',
    'template_id', 'theme_id', 'hosted_token'
  )
order by column_name;
-- Expected: 6 rows, all present

-- ─────────────────────────────────────────────────────────────
-- TEST 2: Verify old columns are dropped
-- ─────────────────────────────────────────────────────────────
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'proposals'
  and column_name in ('generated_content', 'edited_content');
-- Expected: 0 rows

-- ─────────────────────────────────────────────────────────────
-- TEST 3: Verify proposal_views table exists
-- ─────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'proposal_views'
order by ordinal_position;
-- Expected: 7 columns (id, proposal_id, viewed_at, ip_hash, user_agent_hash, is_owner_view, time_on_page_seconds, created_at)

-- ─────────────────────────────────────────────────────────────
-- TEST 4: Verify proposal_events table exists
-- ─────────────────────────────────────────────────────────────
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'proposal_events'
order by ordinal_position;
-- Expected: 6 columns (id, proposal_id, event_type, section_key, metadata, created_at)

-- ─────────────────────────────────────────────────────────────
-- TEST 5: Verify RLS is enabled on new tables
-- ─────────────────────────────────────────────────────────────
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('proposal_views', 'proposal_events');
-- Expected: both rows show rowsecurity = true

-- ─────────────────────────────────────────────────────────────
-- TEST 6: Verify hosted_token uniqueness constraint
-- (Run this only if you have an existing proposal row)
-- ─────────────────────────────────────────────────────────────
-- Step 6a: Get an existing hosted_token
-- select hosted_token from public.proposals limit 1;
--
-- Step 6b: Try to insert a duplicate (should FAIL)
-- insert into public.proposals (user_id, client_name, project_title, hosted_token)
-- values ('some-user-id', 'Test', 'Test', '<paste token from 6a>');
-- Expected: ERROR duplicate key value violates unique constraint

-- ─────────────────────────────────────────────────────────────
-- TEST 7: Verify status constraint includes 'accepted'
-- ─────────────────────────────────────────────────────────────
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.proposals'::regclass
  and contype = 'c';
-- Expected: proposals_status_check includes 'accepted'

-- ─────────────────────────────────────────────────────────────
-- TEST 8: List RLS policies on new tables
-- ─────────────────────────────────────────────────────────────
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('proposal_views', 'proposal_events');
-- Expected: 
--   proposal_views  -> "Owner can read own proposal views" (SELECT only)
--   proposal_events -> "Owner can read own proposal events" (SELECT only)
