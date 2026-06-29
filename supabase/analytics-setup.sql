-- Homegrown website analytics. Run AFTER admin-setup.sql (needs is_admin()).
-- Cookieless: we store a random per-session id (from sessionStorage), never PII.
-- Writes come from the server (/api/track) using the service role, so the table
-- stays locked down (no public insert/select policies needed).

-- 1) page_views: one row per pageview or conversion event --------------------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  event text not null default 'pageview',   -- 'pageview' | 'purchase'
  path text,
  referrer text,
  country text,
  session_id text,
  user_id uuid,
  amount_cents integer,                      -- purchase/refund amount (cents)
  label text,                                -- pack label (purchase/refund events)
  device text,                               -- Mobile | Desktop | Tablet (web)
  browser text,                              -- Chrome | Safari | ... (web)
  utm_source text,                           -- marketing attribution
  utm_medium text,
  utm_campaign text,
  channel text,                              -- derived: Direct | Organic Search | Social | ...
  created_at timestamptz not null default now()
);

-- event is one of: 'pageview' | 'purchase' | 'refund'.

create index if not exists page_views_created_idx on public.page_views (created_at);
create index if not exists page_views_event_idx on public.page_views (event);

-- Lock it down. Reads happen through the SECURITY DEFINER aggregate functions
-- below (admin-gated); writes happen through the service role, which bypasses
-- RLS. With RLS enabled and no policies, the anon/auth roles can't touch it.
alter table public.page_views enable row level security;

-- 2) analytics_summary: headline totals over the last N days -----------------
create or replace function public.analytics_summary(p_days integer default 30)
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  result json;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select json_build_object(
    'views', count(*) filter (where event = 'pageview'),
    'visitors', count(distinct session_id) filter (where event = 'pageview'),
    'purchases', count(*) filter (where event = 'purchase'),
    'revenue_cents', coalesce(sum(amount_cents) filter (where event = 'purchase'), 0),
    'days', greatest(p_days, 1)
  )
  into result
  from page_views
  where created_at >= since;

  return result;
end;
$$;

grant execute on function public.analytics_summary(integer) to authenticated;

-- 3) analytics_daily: views + visitors + purchases per day -------------------
create or replace function public.analytics_daily(p_days integer default 30)
returns table (day date, views bigint, visitors bigint, purchases bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    d::date as day,
    count(pv.*) filter (where pv.event = 'pageview') as views,
    count(distinct pv.session_id) filter (where pv.event = 'pageview') as visitors,
    count(pv.*) filter (where pv.event = 'purchase') as purchases
  from generate_series(date_trunc('day', since), date_trunc('day', now()), interval '1 day') d
  left join page_views pv
    on date_trunc('day', pv.created_at) = d
  group by d
  order by d;
end;
$$;

grant execute on function public.analytics_daily(integer) to authenticated;

-- 4) analytics_top_paths: most-viewed pages ----------------------------------
create or replace function public.analytics_top_paths(p_days integer default 30, p_limit integer default 10)
returns table (path text, views bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(pv.path, '(unknown)') as path, count(*) as views
  from page_views pv
  where pv.created_at >= since and pv.event = 'pageview'
  group by 1
  order by views desc
  limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_paths(integer, integer) to authenticated;

-- 5) analytics_top_referrers: where traffic comes from -----------------------
create or replace function public.analytics_top_referrers(p_days integer default 30, p_limit integer default 10)
returns table (referrer text, views bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(nullif(pv.referrer, ''), '(direct)') as referrer, count(*) as views
  from page_views pv
  where pv.created_at >= since and pv.event = 'pageview'
  group by 1
  order by views desc
  limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_referrers(integer, integer) to authenticated;

-- 6) analytics_top_countries: visitor geography (from Vercel edge headers) ----
create or replace function public.analytics_top_countries(p_days integer default 30, p_limit integer default 10)
returns table (country text, views bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(nullif(pv.country, ''), '(unknown)') as country, count(*) as views
  from page_views pv
  where pv.created_at >= since and pv.event = 'pageview'
  group by 1
  order by views desc
  limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_countries(integer, integer) to authenticated;

-- 7) analytics_sales_by_pack: revenue + count per pack (mirrors Stripe) -------
create or replace function public.analytics_sales_by_pack(p_days integer default 30)
returns table (label text, sales bigint, revenue_cents bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(pv.label, '(unknown)') as label,
         count(*) as sales,
         coalesce(sum(pv.amount_cents), 0) as revenue_cents
  from page_views pv
  where pv.created_at >= since and pv.event = 'purchase'
  group by 1
  order by revenue_cents desc;
end;
$$;

grant execute on function public.analytics_sales_by_pack(integer) to authenticated;

-- 8) analytics_recent_purchases: per-user purchase log (who bought what) ------
create or replace function public.analytics_recent_purchases(p_days integer default 30, p_limit integer default 100)
returns table (created_at timestamptz, email text, label text, amount_cents integer)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select pv.created_at,
         p.email,
         coalesce(pv.label, '(unknown)') as label,
         pv.amount_cents
  from page_views pv
  left join profiles p on p.id = pv.user_id
  where pv.event = 'purchase' and pv.created_at >= since
  order by pv.created_at desc
  limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_recent_purchases(integer, integer) to authenticated;

-- ===========================================================================
-- Marketing + Web + Financial expansion. These supersede the summary/daily
-- definitions above when this file is run top-to-bottom.
-- ===========================================================================

-- Summary: add refunds (event = 'refund', amount stored positive).
create or replace function public.analytics_summary(p_days integer default 30)
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  result json;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select json_build_object(
    'views', count(*) filter (where event = 'pageview'),
    'visitors', count(distinct session_id) filter (where event = 'pageview'),
    'purchases', count(*) filter (where event = 'purchase'),
    'revenue_cents', coalesce(sum(amount_cents) filter (where event = 'purchase'), 0),
    'refunds', count(*) filter (where event = 'refund'),
    'refunds_cents', coalesce(sum(amount_cents) filter (where event = 'refund'), 0),
    'days', greatest(p_days, 1)
  )
  into result
  from page_views
  where created_at >= since;

  return result;
end;
$$;

grant execute on function public.analytics_summary(integer) to authenticated;

-- Daily: add gross revenue per day (return shape changes, so drop first).
drop function if exists public.analytics_daily(integer);
create function public.analytics_daily(p_days integer default 30)
returns table (day date, views bigint, visitors bigint, purchases bigint, revenue_cents bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    d::date as day,
    count(pv.*) filter (where pv.event = 'pageview') as views,
    count(distinct pv.session_id) filter (where pv.event = 'pageview') as visitors,
    count(pv.*) filter (where pv.event = 'purchase') as purchases,
    coalesce(sum(pv.amount_cents) filter (where pv.event = 'purchase'), 0) as revenue_cents
  from generate_series(date_trunc('day', since), date_trunc('day', now()), interval '1 day') d
  left join page_views pv on date_trunc('day', pv.created_at) = d
  group by d
  order by d;
end;
$$;

grant execute on function public.analytics_daily(integer) to authenticated;

-- Marketing: traffic + revenue by channel (last-touch attribution on sales).
create or replace function public.analytics_channels(p_days integer default 30)
returns table (channel text, views bigint, sales bigint, revenue_cents bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select coalesce(nullif(pv.channel, ''), 'Direct') as channel,
         count(*) filter (where pv.event = 'pageview') as views,
         count(*) filter (where pv.event = 'purchase') as sales,
         coalesce(sum(pv.amount_cents) filter (where pv.event = 'purchase'), 0) as revenue_cents
  from page_views pv
  where pv.created_at >= since
  group by 1 order by revenue_cents desc, views desc;
end;
$$;

grant execute on function public.analytics_channels(integer) to authenticated;

-- Marketing: traffic + revenue by UTM campaign.
create or replace function public.analytics_top_campaigns(p_days integer default 30, p_limit integer default 10)
returns table (campaign text, views bigint, sales bigint, revenue_cents bigint)
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select coalesce(nullif(pv.utm_campaign, ''), '(none)') as campaign,
         count(*) filter (where pv.event = 'pageview') as views,
         count(*) filter (where pv.event = 'purchase') as sales,
         coalesce(sum(pv.amount_cents) filter (where pv.event = 'purchase'), 0) as revenue_cents
  from page_views pv
  where pv.created_at >= since
  group by 1 order by revenue_cents desc, views desc
  limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_campaigns(integer, integer) to authenticated;

-- Web: device + browser breakdowns.
create or replace function public.analytics_top_devices(p_days integer default 30, p_limit integer default 10)
returns table (device text, views bigint)
language plpgsql stable security definer set search_path = public
as $$
declare since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select coalesce(nullif(pv.device, ''), '(unknown)') as device, count(*) as views
  from page_views pv where pv.created_at >= since and pv.event = 'pageview'
  group by 1 order by views desc limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_devices(integer, integer) to authenticated;

create or replace function public.analytics_top_browsers(p_days integer default 30, p_limit integer default 10)
returns table (browser text, views bigint)
language plpgsql stable security definer set search_path = public
as $$
declare since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
  select coalesce(nullif(pv.browser, ''), '(unknown)') as browser, count(*) as views
  from page_views pv where pv.created_at >= since and pv.event = 'pageview'
  group by 1 order by views desc limit greatest(p_limit, 1);
end;
$$;

grant execute on function public.analytics_top_browsers(integer, integer) to authenticated;
