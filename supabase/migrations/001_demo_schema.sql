begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.demo_properties (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_customer_profiles (
  id text primary key,
  message_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_messages (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_rules (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_sessions_user_id_required check (user_id is not null)
);

create unique index if not exists demo_sessions_user_id_idx
on public.demo_sessions (user_id);

create table if not exists public.demo_user_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  state_key text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_user_state_user_id_required check (user_id is not null),
  constraint demo_user_state_key_not_empty check (length(trim(state_key)) > 0),
  constraint demo_user_state_owner_key_unique unique (user_id, state_key)
);

create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_events_user_id_required check (user_id is not null)
);

create index if not exists demo_events_user_created_idx
on public.demo_events (user_id, created_at desc);

drop trigger if exists set_demo_properties_updated_at on public.demo_properties;
create trigger set_demo_properties_updated_at
before update on public.demo_properties
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_customer_profiles_updated_at on public.demo_customer_profiles;
create trigger set_demo_customer_profiles_updated_at
before update on public.demo_customer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_messages_updated_at on public.demo_messages;
create trigger set_demo_messages_updated_at
before update on public.demo_messages
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_rules_updated_at on public.demo_rules;
create trigger set_demo_rules_updated_at
before update on public.demo_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_sessions_updated_at on public.demo_sessions;
create trigger set_demo_sessions_updated_at
before update on public.demo_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_user_state_updated_at on public.demo_user_state;
create trigger set_demo_user_state_updated_at
before update on public.demo_user_state
for each row execute function public.set_updated_at();

drop trigger if exists set_demo_events_updated_at on public.demo_events;
create trigger set_demo_events_updated_at
before update on public.demo_events
for each row execute function public.set_updated_at();

alter table public.demo_properties enable row level security;
alter table public.demo_customer_profiles enable row level security;
alter table public.demo_messages enable row level security;
alter table public.demo_rules enable row level security;
alter table public.demo_sessions enable row level security;
alter table public.demo_user_state enable row level security;
alter table public.demo_events enable row level security;

drop policy if exists "demo_properties_read_seed" on public.demo_properties;
create policy "demo_properties_read_seed"
on public.demo_properties
for select
to anon, authenticated
using (true);

drop policy if exists "demo_customer_profiles_read_seed" on public.demo_customer_profiles;
create policy "demo_customer_profiles_read_seed"
on public.demo_customer_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "demo_messages_read_seed" on public.demo_messages;
create policy "demo_messages_read_seed"
on public.demo_messages
for select
to anon, authenticated
using (true);

drop policy if exists "demo_rules_read_seed" on public.demo_rules;
create policy "demo_rules_read_seed"
on public.demo_rules
for select
to anon, authenticated
using (true);

drop policy if exists "demo_sessions_select_own" on public.demo_sessions;
create policy "demo_sessions_select_own"
on public.demo_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "demo_sessions_insert_own" on public.demo_sessions;
create policy "demo_sessions_insert_own"
on public.demo_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "demo_sessions_update_own" on public.demo_sessions;
create policy "demo_sessions_update_own"
on public.demo_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "demo_sessions_delete_own" on public.demo_sessions;
create policy "demo_sessions_delete_own"
on public.demo_sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "demo_user_state_select_own" on public.demo_user_state;
create policy "demo_user_state_select_own"
on public.demo_user_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "demo_user_state_insert_own" on public.demo_user_state;
create policy "demo_user_state_insert_own"
on public.demo_user_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "demo_user_state_update_own" on public.demo_user_state;
create policy "demo_user_state_update_own"
on public.demo_user_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "demo_user_state_delete_own" on public.demo_user_state;
create policy "demo_user_state_delete_own"
on public.demo_user_state
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "demo_events_select_own" on public.demo_events;
create policy "demo_events_select_own"
on public.demo_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "demo_events_insert_own" on public.demo_events;
create policy "demo_events_insert_own"
on public.demo_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "demo_events_update_own" on public.demo_events;
create policy "demo_events_update_own"
on public.demo_events
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "demo_events_delete_own" on public.demo_events;
create policy "demo_events_delete_own"
on public.demo_events
for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';

commit;
