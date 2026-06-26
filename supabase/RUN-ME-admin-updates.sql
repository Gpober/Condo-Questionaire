-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ ONE-SHOT ADMIN UPDATES — paste this whole file into Supabase SQL Editor   │
-- │ and run it once. Safe to re-run (idempotent).                             │
-- │ Prerequisites already applied: admin-setup.sql, secure-paywall.sql.       │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 1) ADMIN FREE ACCESS ------------------------------------------------------
-- Admins open ANY condo record without paying; everyone else still needs a
-- paid `lookups` row.
create or replace function public.get_unlocked_project(p_project_id bigint)
returns setof public.condo_projects
language sql stable security definer set search_path = public
as $$
  select c.*
  from condo_projects c
  where c.id = p_project_id
    and (
      public.is_admin()
      or exists (
        select 1 from lookups l
        where l.user_id = auth.uid() and l.project_id = p_project_id
      )
    );
$$;

grant execute on function public.get_unlocked_project(bigint) to authenticated;

-- 2) ADMIN RECORD REVIEWS ---------------------------------------------------
-- One row per project: admins mark records "verified" or "needs_fixing".
create table if not exists public.record_reviews (
  project_id  bigint primary key references public.condo_projects(id) on delete cascade,
  status      text not null check (status in ('verified', 'needs_fixing')),
  note        text,
  reviewed_by text,
  reviewed_at timestamptz not null default now()
);

alter table public.record_reviews enable row level security;

-- Signed-in users may READ status; only admins may WRITE.
drop policy if exists "read record_reviews" on public.record_reviews;
create policy "read record_reviews"
  on public.record_reviews for select
  to authenticated
  using (true);

drop policy if exists "admins write record_reviews" on public.record_reviews;
create policy "admins write record_reviews"
  on public.record_reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3) (OPTIONAL) ENFORCE EXACTLY TWO ADMINS ----------------------------------
-- Uncomment to remove any admin emails other than these two.
-- delete from public.admins
--   where lower(email) not in ('gdeleon@iamcfo.com', 'gpober@iamcfo.com');
