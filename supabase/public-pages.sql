-- PUBLIC SEO PAGES. Run AFTER secure-paywall.sql.
--
-- Exposes a SUMMARY-ONLY, coarse warrantability status for the public,
-- indexable /condo/[id] pages. The raw review text, dates, expirations, and
-- source documents are NEVER returned here — those stay behind the credit
-- paywall (get_unlocked_project). SECURITY DEFINER so it can read the locked
-- tables while callers cannot query them directly.

create or replace function public.public_condo_status(p_condo_id bigint)
returns table (
  id bigint,
  project_name text,
  county text,
  state text,
  zip_code text,
  status text
)
language sql stable security definer set search_path = public
as $$
  select
    c.id,
    c.project_name,
    c.county,
    c.state,
    c.zip_code,
    case
      -- Approximate blacklist match: same state, and either same zip or a
      -- normalized name match. (The app does fuzzier matching on the paid page.)
      when exists (
        select 1 from blacklisted_projects b
        where upper(coalesce(b.state, '')) = upper(coalesce(c.state, ''))
          and (
            (b.zip is not null and b.zip = c.zip_code)
            or regexp_replace(lower(coalesce(b.project_legal_name, '')), '[^a-z0-9]', '', 'g')
             = regexp_replace(lower(coalesce(c.project_name, '')), '[^a-z0-9]', '', 'g')
          )
      ) then 'blacklisted'
      when c.condo_review ~* '(ineligible|denied|non[ -]?warrantable|reject|fail)' then 'non_warrantable'
      when c.condo_review ~* '(eligible|approved|warrantable|pass|accept)' then 'warrantable'
      else 'unknown'
    end as status
  from condo_projects c
  where c.id = p_condo_id;
$$;

grant execute on function public.public_condo_status(bigint) to anon, authenticated;
