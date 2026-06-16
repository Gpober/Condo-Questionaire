-- Admin portal access + leads CRM. Run AFTER leads-setup.sql.

-- 1) Who is an admin (by email) -------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No direct select policy; access is checked via the is_admin() function below.

-- Admin emails (the addresses each person signs in with).
insert into public.admins (email) values
  ('gpober@iamcfo.com'),
  ('gdeleon@iamcfo.com')
on conflict (email) do nothing;

-- 2) is_admin(): true if the signed-in user's email is in admins -----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 3) Lead status workflow --------------------------------------------------
alter table public.leads add column if not exists status text not null default 'new';

-- 4) Admin-only access to leads -------------------------------------------
drop policy if exists "Admins read leads" on public.leads;
create policy "Admins read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update leads" on public.leads;
create policy "Admins update leads"
  on public.leads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
