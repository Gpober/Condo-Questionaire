-- ADMIN FREE ACCESS. Run AFTER secure-paywall.sql and admin-setup.sql.
--
-- Lets admins (emails in public.admins, checked by is_admin()) open ANY condo
-- record without paying / spending a credit. Everyone else still needs a
-- matching `lookups` row (i.e. they paid). This only adds an OR branch to the
-- existing get_unlocked_project() function.
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
