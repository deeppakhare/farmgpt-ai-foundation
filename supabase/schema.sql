-- FarmGPT AI — Supabase schema (structure only; auth/queries wired later)
-- Runs on Postgres. Every public.* table has grants + RLS.

-- Extensions
create extension if not exists "pgcrypto";

-- Roles enum
do $$ begin
  create type public.app_role as enum ('farmer', 'admin');
exception when duplicate_object then null; end $$;

------------------------------------------------------------
-- USERS: profile row per auth.users
------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  phone text,
  preferred_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles: owner read"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles: owner insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles: owner update" on public.profiles for update to authenticated using (auth.uid() = id);

------------------------------------------------------------
-- USER ROLES (never store role on profiles — privilege escalation risk)
------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'farmer',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

------------------------------------------------------------
-- FARM PROFILE
------------------------------------------------------------
create table if not exists public.farm_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  farmer_name text,
  village text,
  district text,
  state text,
  farm_size_acres numeric(10,2),
  primary_crop text,
  secondary_crop text,
  soil_type text,
  water_source text,
  preferred_language text default 'en',
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.farm_profiles to authenticated;
grant all on public.farm_profiles to service_role;
alter table public.farm_profiles enable row level security;
create policy "farm: owner all" on public.farm_profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- CHATS + MESSAGES
------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chats to authenticated;
grant all on public.chats to service_role;
alter table public.chats enable row level security;
create policy "chats: owner all" on public.chats for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists chats_user_updated_idx on public.chats(user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "msgs: owner all" on public.chat_messages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists msgs_chat_created_idx on public.chat_messages(chat_id, created_at);

------------------------------------------------------------
-- REPORTS
------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'general',
  file_url text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports: owner all" on public.reports for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- NOTIFICATIONS
------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifs: owner all" on public.notifications for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- SETTINGS (per user)
------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  language text not null default 'en',
  notify_weather boolean not null default true,
  notify_disease boolean not null default true,
  notify_market boolean not null default true,
  notify_weekly_report boolean not null default false,
  share_anon_data boolean not null default true,
  personalised boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_settings to authenticated;
grant all on public.user_settings to service_role;
alter table public.user_settings enable row level security;
create policy "settings: owner all" on public.user_settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
