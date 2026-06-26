-- ADMIN RECORD REVIEWS. Run AFTER admin-setup.sql and secure-paywall.sql.
--
-- Lets admins mark each condo record as "verified" or "needs_fixing" while they
-- audit the data. One row per project (the latest decision).
create table if not exists public.record_reviews (
  project_id  bigint primary key references public.condo_projects(id) on delete cascade,
  status      text not null check (status in ('verified', 'needs_fixing')),
  note        text,
  reviewed_by text,
  reviewed_at timestamptz not null default now()
);

alter table public.record_reviews enable row level security;

-- Signed-in users may READ review status (so we can show a "verified" marker);
-- only admins may WRITE.
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
