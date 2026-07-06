
-- Extensions
create extension if not exists "pgcrypto";

-- Roles enum
do $$ begin
  create type public.app_role as enum ('farmer', 'admin');
exception when duplicate_object then null; end $$;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

------------------------------------------------------------
-- profiles
------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  phone text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles owner select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles owner update" on public.profiles for update to authenticated using (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- user_roles
------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'farmer',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles owner select" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

------------------------------------------------------------
-- farms
------------------------------------------------------------
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Farm',
  village text,
  district text,
  state text,
  country text default 'India',
  farm_size_acres numeric(10,2),
  primary_crop text,
  secondary_crop text,
  soil_type text,
  water_source text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.farms to authenticated;
grant all on public.farms to service_role;
alter table public.farms enable row level security;
create policy "farms owner all" on public.farms for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index farms_user_idx on public.farms(user_id);
create trigger farms_updated_at before update on public.farms for each row execute function public.set_updated_at();

------------------------------------------------------------
-- chat_history: conversations + messages
------------------------------------------------------------
create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  pinned boolean not null default false,
  agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_history to authenticated;
grant all on public.chat_history to service_role;
alter table public.chat_history enable row level security;
create policy "chat_history owner all" on public.chat_history for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index chat_history_user_updated_idx on public.chat_history(user_id, updated_at desc);
create trigger chat_history_updated_at before update on public.chat_history for each row execute function public.set_updated_at();

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chat_history(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  image_url text,
  agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "chat_messages owner all" on public.chat_messages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index chat_messages_chat_idx on public.chat_messages(chat_id, created_at);

------------------------------------------------------------
-- reports
------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid references public.chat_history(id) on delete set null,
  title text not null,
  kind text not null default 'general',
  summary text,
  file_url text,
  size_bytes bigint,
  data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports owner all" on public.reports for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index reports_user_created_idx on public.reports(user_id, created_at desc);
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
