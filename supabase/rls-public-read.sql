-- Run this in Supabase → SQL Editor to make the app work LIVE while login is
-- disabled. With no login, the app queries as the `anon` role, so anon needs
-- read access. These policies grant READ-ONLY access and nothing else.
--
-- When you re-enable login later, swap `anon` for `authenticated` in the
-- `to ...` clauses (or add authenticated as well).

-- condo_projects -----------------------------------------------------------
alter table public.condo_projects enable row level security;

drop policy if exists "Public read condo_projects" on public.condo_projects;
create policy "Public read condo_projects"
  on public.condo_projects
  for select
  to anon, authenticated
  using (true);

-- blacklisted_projects -----------------------------------------------------
alter table public.blacklisted_projects enable row level security;

drop policy if exists "Public read blacklisted_projects" on public.blacklisted_projects;
create policy "Public read blacklisted_projects"
  on public.blacklisted_projects
  for select
  to anon, authenticated
  using (true);
