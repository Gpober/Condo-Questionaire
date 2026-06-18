-- Email capture / marketing list. Run AFTER admin-setup.sql (needs is_admin()).
-- Public form: anyone can subscribe; the list is readable only by admins.

create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Anyone can add themselves (the upsert in subscribeAction relies on the unique
-- email + ignoreDuplicates, so resubmitting the same email is a no-op).
drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

-- Only admins can read the list (export from the dashboard or /admin).
drop policy if exists "Admins read subscribers" on public.subscribers;
create policy "Admins read subscribers"
  on public.subscribers for select
  to authenticated
  using (public.is_admin());
