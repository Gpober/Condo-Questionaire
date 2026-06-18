-- Referrals: invite a colleague, both get bonus credits.
-- Run AFTER credits-setup.sql (needs profiles + credit_balance).

-- 1) Columns on profiles ----------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users (id);

-- 2) Referrals ledger -------------------------------------------------------
create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_id uuid not null references auth.users (id) on delete cascade,
  referrer_credits integer not null default 2,
  referred_credits integer not null default 1,
  created_at timestamptz not null default now(),
  unique (referred_id) -- a user can only be referred once
);

alter table public.referrals enable row level security;

drop policy if exists "Users read own referrals" on public.referrals;
create policy "Users read own referrals"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- 3) Short, unambiguous code generator (no 0/O/1/I) -------------------------
create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..7 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from profiles where referral_code = code);
  end loop;
  return code;
end;
$$;

-- 4) get_referral_info(): ensures the caller has a code, returns their tally --
-- Returns json: { status:'ok', code, referred_count, credits_earned }
create or replace function public.get_referral_info()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c text;
  cnt int;
  earned int;
begin
  if uid is null then
    return json_build_object('status', 'unauthenticated');
  end if;

  select referral_code into c from profiles where id = uid;
  if c is null then
    c := gen_referral_code();
    update profiles set referral_code = c where id = uid;
  end if;

  select count(*), coalesce(sum(referrer_credits), 0)
    into cnt, earned
    from referrals where referrer_id = uid;

  return json_build_object(
    'status', 'ok', 'code', c, 'referred_count', cnt, 'credits_earned', earned
  );
end;
$$;

grant execute on function public.get_referral_info() to authenticated;

-- 5) apply_referral(): the invited user redeems a code (idempotent) ---------
-- Returns json: { status:'applied'|'already_referred'|'invalid_code'|'self'|'no_code' }
create or replace function public.apply_referral(p_code text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ref uuid;
  rc int := 2; -- referrer reward
  vc int := 1; -- referred (new user) reward
begin
  if uid is null then
    return json_build_object('status', 'unauthenticated');
  end if;
  if p_code is null or length(trim(p_code)) = 0 then
    return json_build_object('status', 'no_code');
  end if;

  -- Already credited once? Do nothing.
  if exists (select 1 from referrals where referred_id = uid) then
    return json_build_object('status', 'already_referred');
  end if;

  select id into ref from profiles where upper(referral_code) = upper(trim(p_code));
  if ref is null then
    return json_build_object('status', 'invalid_code');
  end if;
  if ref = uid then
    return json_build_object('status', 'self');
  end if;

  insert into referrals (referrer_id, referred_id, referrer_credits, referred_credits)
    values (ref, uid, rc, vc);
  update profiles set referred_by = ref where id = uid;
  update profiles set credit_balance = credit_balance + rc where id = ref;
  update profiles set credit_balance = credit_balance + vc where id = uid;

  return json_build_object('status', 'applied', 'credited', vc);
end;
$$;

grant execute on function public.apply_referral(text) to authenticated;
