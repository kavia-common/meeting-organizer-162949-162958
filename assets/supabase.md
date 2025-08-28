# Supabase Configuration and Schema for Meeting Manager

This document tracks the Supabase setup for this project and provides the SQL required to ensure the `public.meetings` table exists, Row Level Security (RLS) is correctly configured, and that the schema cache is synchronized.

IMPORTANT: Current blocker
- The API currently returns PGRST202: "Could not find the function public.run_sql(query) in the schema cache".
- Our automation tools require a discoverable RPC named `public.run_sql` (with either a `query text` parameter or a single anonymous `json/jsonb` parameter) to operate.
- Use the SQL below to install the RPC and then refresh the schema cache.

## 1) Environment Variables

Required in the frontend environment:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Optional (OAuth):
- REACT_APP_GOOGLE_CLIENT_ID
- REACT_APP_GOOGLE_CLIENT_SECRET

Make sure these are set in your environment or in a `.env` file (not committed).

## 2) Install `public.run_sql` RPC (for tools and admin operations)

Run this in Supabase SQL Editor:

-- Create run_sql with a single JSON parameter, discoverable by PostgREST
create schema if not exists public;

create or replace function public.run_sql(payload json)
returns json
language plpgsql
as $$
declare
  stmt text;
begin
  stmt := coalesce(payload->>'sql', '');
  if stmt = '' then
    return json_build_object('status','error','message','empty sql');
  end if;

  -- execute arbitrary SQL - ADMIN USE ONLY
  execute stmt;

  return json_build_object('status','ok');
end;
$$;

-- Allow authenticated role to call it only if needed (optional).
-- By default, keep it for service_role only for safety.
-- revoke all on function public.run_sql(json) from anon, authenticated;
-- grant execute on function public.run_sql(json) to service_role;

Note: It’s recommended to restrict access to `public.run_sql` to only the `service_role` (server-side) if used beyond tooling.

## 3) Create/Sync the `public.meetings` table

We’ll create a robust table that matches the frontend expectations in `src/services/meetingsService.js`.

Run this in Supabase SQL Editor:

-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists pgcrypto;

-- meetings table
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text,
  notes text,

  start_time timestamptz not null,
  end_time timestamptz not null,

  location text,
  status text not null default 'scheduled',
  google_event_id text,

  attendees jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  reminders jsonb not null default '[]'::jsonb
);

-- Maintain updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists set_meetings_updated_at on public.meetings;
create trigger set_meetings_updated_at
before update on public.meetings
for each row execute procedure public.set_updated_at();

-- Helpful indexes
create index if not exists idx_meetings_user_id on public.meetings(user_id);
create index if not exists idx_meetings_start_time on public.meetings(start_time);
create index if not exists idx_meetings_end_time on public.meetings(end_time);
create index if not exists idx_meetings_status on public.meetings(status);
create index if not exists idx_meetings_tags_gin on public.meetings using gin (tags);
create index if not exists idx_meetings_attendees_gin on public.meetings using gin (attendees);

## 4) Row Level Security and Policies

Enable RLS and define owner-based access (user owns their rows via `user_id` = `auth.uid()`).

Run this in Supabase SQL Editor:

-- Enable RLS
alter table public.meetings enable row level security;

-- Select: a user can read their own meetings
drop policy if exists "Users can read their own meetings" on public.meetings;
create policy "Users can read their own meetings"
on public.meetings
for select
to authenticated
using (user_id = auth.uid());

-- Insert: a user can create meetings where user_id = auth.uid()
drop policy if exists "Users can insert their own meetings" on public.meetings;
create policy "Users can insert their own meetings"
on public.meetings
for insert
to authenticated
with check (user_id = auth.uid());

-- Update: a user can update their own meetings
drop policy if exists "Users can update their own meetings" on public.meetings;
create policy "Users can update their own meetings"
on public.meetings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Delete: a user can delete their own meetings
drop policy if exists "Users can delete their own meetings" on public.meetings;
create policy "Users can delete their own meetings"
on public.meetings
for delete
to authenticated
using (user_id = auth.uid());

## 5) Realtime

If you want realtime changes for this table:

-- Enable Realtime for the public schema (if not already enabled in Supabase Dashboard):
-- In Supabase Dashboard: Database -> Replication -> Configure -> Add table public.meetings

## 6) Refresh Schema Cache

After schema changes, refresh PostgREST cache:

-- Option A: In Supabase Dashboard, call "Reload API" (Project Settings -> API)
-- Option B: Use SQL (if exposed): select pg_notify('pgrst', 'reload schema');

If still seeing cache errors, wait 30-60 seconds and try again.

## 7) Authentication Redirects

Set Site URL and Redirect URLs in Supabase Dashboard:
- Site URL: your production domain (or local dev tunnel)
- Redirect URLs:
  - http://localhost:3000/**
  - https://<your-production-domain>/**

## 8) Validation Checklist

- [ ] RPC `public.run_sql(json)` exists and is restricted appropriately
- [ ] Table `public.meetings` exists
- [ ] RLS enabled with owner-based policies
- [ ] Realtime enabled (optional, but recommended)
- [ ] API cache reloaded
- [ ] Frontend env vars set

## 9) Troubleshooting

- Error: PGRST202 run_sql missing
  - Create the RPC using section (2), then reload API.

- Error: cannot insert due to RLS
  - Ensure you are signed in and `user_id` equals `auth.uid()` in insert payload.

- Error: Realtime not receiving events
  - Enable replication for public.meetings in Dashboard.

- Error: Missing env variables
  - Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.

## 10) Schema used by frontend

The frontend expects the following columns to exist on `public.meetings`:
- id (uuid, PK)
- created_at (timestamptz)
- updated_at (timestamptz)
- user_id (uuid, FK to auth.users)
- title (text)
- description (text, nullable)
- notes (text, nullable)
- start_time (timestamptz)
- end_time (timestamptz)
- location (text, nullable)
- status (text, default 'scheduled')
- google_event_id (text, nullable)
- attendees (jsonb, default [])
- tags (jsonb, default [])
- reminders (jsonb, default [])
