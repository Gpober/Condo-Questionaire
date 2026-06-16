-- DB-ENFORCED PAYWALL. Run AFTER credits-setup.sql.
--
-- Goal: the full condo record (condo_review, expirations, etc.) must NOT be
-- readable directly via the anon/authenticated API. Only two paths exist:
--   1) search_condos()        -> returns SUMMARY columns only (public)
--   2) get_unlocked_project() -> returns the FULL row only if the caller has
--                                paid (has a lookups row for that project)
-- Both are SECURITY DEFINER so they bypass RLS; we then remove the broad
-- read policies so the tables can't be queried directly.

-- 1) Remove direct read access to the paid tables -------------------------
alter table public.condo_projects enable row level security;
drop policy if exists "Public read condo_projects" on public.condo_projects;
-- (No SELECT policy remains -> direct selects return nothing.)

alter table public.blacklisted_projects enable row level security;
drop policy if exists "Public read blacklisted_projects" on public.blacklisted_projects;
-- Blacklist detail is shown only on the (paid) record page, to signed-in users.
drop policy if exists "Authenticated read blacklisted_projects" on public.blacklisted_projects;
create policy "Authenticated read blacklisted_projects"
  on public.blacklisted_projects for select
  to authenticated using (true);

-- 2) Public search: SUMMARY columns only ----------------------------------
create or replace function public.search_condos(
  p_state text default null,
  p_county text default null,
  p_project_name text default null,
  p_zip text default null,
  p_condo_id bigint default null
)
returns table (
  id bigint,
  project_name text,
  county text,
  state text,
  zip_code text
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.project_name, c.county, c.state, c.zip_code
  from condo_projects c
  where (p_state is null or c.state = p_state)
    and (p_county is null or c.county ilike '%' || p_county || '%')
    and (p_project_name is null or c.project_name ilike '%' || p_project_name || '%')
    and (p_zip is null or c.zip_code ilike '%' || p_zip || '%')
    and (p_condo_id is null or c.id = p_condo_id);
$$;

grant execute on function public.search_condos(text, text, text, text, bigint)
  to anon, authenticated;

-- 3) Full record: only if the caller has unlocked (paid for) it ------------
create or replace function public.get_unlocked_project(p_project_id bigint)
returns setof public.condo_projects
language sql stable security definer set search_path = public
as $$
  select c.*
  from condo_projects c
  where c.id = p_project_id
    and exists (
      select 1 from lookups l
      where l.user_id = auth.uid() and l.project_id = p_project_id
    );
$$;

grant execute on function public.get_unlocked_project(bigint) to authenticated;
