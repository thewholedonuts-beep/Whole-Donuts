create extension if not exists citext;
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  journey jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dedication_awards (
  id uuid primary key default gen_random_uuid(),
  code uuid not null unique default gen_random_uuid(),
  recipient_email citext not null,
  greeting text not null check (char_length(greeting) between 1 and 280),
  recipient_id uuid references auth.users on delete set null,
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  revoked_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.dedication_awards enable row level security;

create policy "Members read their own profile"
  on public.profiles for select to authenticated using (id = auth.uid());
create policy "Members update their own profile"
  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create function public.claim_dedication_award(award_code uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  award public.dedication_awards;
  claimant_email citext;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select email into claimant_email from auth.users where id = auth.uid();
  select * into award from public.dedication_awards where code = award_code for update;
  if award.id is null or award.revoked_at is not null then
    raise exception 'Award is unavailable';
  end if;
  if lower(award.recipient_email::text) <> lower(claimant_email::text) then
    raise exception 'Award belongs to a different email address';
  end if;
  if award.recipient_id is not null and award.recipient_id <> auth.uid() then
    raise exception 'Award has already been claimed';
  end if;

  update public.dedication_awards
  set recipient_id = auth.uid(), redeemed_at = coalesce(redeemed_at, now())
  where id = award.id;
  return award.greeting;
end;
$$;

revoke all on public.dedication_awards from anon, authenticated;
grant execute on function public.claim_dedication_award(uuid) to authenticated;
