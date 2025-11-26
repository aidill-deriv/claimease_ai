-- Allowed users / roles table for ClaimEase
-- Run in Supabase SQL editor or via migration tooling
-- Enable citext extension for case-insensitive text comparison
CREATE EXTENSION IF NOT EXISTS citext;

create table if not exists public.allowed_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  full_name text,
  role text not null default 'viewer' check (role in ('viewer', 'admin', 'superadmin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  password_hash text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists allowed_users_email_idx on public.allowed_users (email);

comment on table public.allowed_users is 'List of ClaimEase accounts and their roles.';
comment on column public.allowed_users.password_hash is 'BCrypt or Argon2 hash for password-protected roles.';

create or replace function public.allowed_users_updated_at_trigger()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_allowed_users_updated_at on public.allowed_users;
create trigger trg_allowed_users_updated_at
before update on public.allowed_users
for each row
execute function public.allowed_users_updated_at_trigger();
