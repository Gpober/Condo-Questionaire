-- Lead capture for the "What's Next" page. Run in Supabase → SQL Editor.
-- Public form: anyone can submit; rows are NOT publicly readable.

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text,
  project_name text,
  state text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "Anyone can submit a lead" on public.leads;
create policy "Anyone can submit a lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- (No SELECT policy: leads are readable only via the service role / dashboard.)
