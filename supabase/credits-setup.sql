-- Credits + paywall schema. Run in Supabase → SQL Editor.
-- Search stays public; viewing a condo's cached record costs 1 credit and
-- requires a signed-in user.

-- 1) profiles: one row per auth user, holds the credit balance --------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  credit_balance integer not null default 0 check (credit_balance >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated using (auth.uid() = id);

-- (No insert/update policy: balances are only changed by SECURITY DEFINER
--  functions below and the Stripe webhook via the service role.)

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) lookups: audit log / "unlocks" -----------------------------------------
create table if not exists public.lookups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id bigint not null,
  credits_spent integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists lookups_user_project_uniq
  on public.lookups (user_id, project_id);

alter table public.lookups enable row level security;

drop policy if exists "Users read own lookups" on public.lookups;
create policy "Users read own lookups"
  on public.lookups for select
  to authenticated using (auth.uid() = user_id);

-- 3) redeem_credit: atomically spend 1 credit to unlock a project -----------
-- Returns json: { status: 'unlocked' | 'already_unlocked' | 'insufficient',
--                 balance: <remaining> }
create or replace function public.redeem_credit(p_project_id bigint)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal integer;
begin
  if uid is null then
    return json_build_object('status', 'unauthenticated');
  end if;

  -- Already unlocked? View again for free.
  if exists (select 1 from lookups where user_id = uid and project_id = p_project_id) then
    select credit_balance into bal from profiles where id = uid;
    return json_build_object('status', 'already_unlocked', 'balance', bal);
  end if;

  -- Lock the row to avoid double-spend on concurrent requests.
  select credit_balance into bal from profiles where id = uid for update;
  if bal is null or bal <= 0 then
    return json_build_object('status', 'insufficient', 'balance', coalesce(bal, 0));
  end if;

  update profiles set credit_balance = credit_balance - 1 where id = uid;
  insert into lookups (user_id, project_id, credits_spent) values (uid, p_project_id, 1)
    on conflict (user_id, project_id) do nothing;

  select credit_balance into bal from profiles where id = uid;
  return json_build_object('status', 'unlocked', 'balance', bal);
end;
$$;

-- 4) add_credits: used by the Stripe webhook (service role) ------------------
create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  bal integer;
begin
  update profiles set credit_balance = credit_balance + p_amount
   where id = p_user_id
   returning credit_balance into bal;
  return bal;
end;
$$;

-- 5) grant_test_credits: TEMPORARY helper so you can exercise the flow before
--    Stripe is wired. REMOVE (or revoke) before real launch.
create or replace function public.grant_test_credits(p_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  bal integer;
begin
  if auth.uid() is null then return null; end if;
  update profiles set credit_balance = credit_balance + p_amount
   where id = auth.uid()
   returning credit_balance into bal;
  return bal;
end;
$$;
