create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  default_passport_iso3 text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_passport_iso3_check check (default_passport_iso3 is null or default_passport_iso3 ~ '^[A-Z]{3}$')
);

create table if not exists public.travel_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  preferences jsonb not null default '{"travelMonth":"","tripDays":7,"regions":[],"visaTolerance":"evisa","includeVisaRequired":false}'::jsonb,
  share_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.travel_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  passport_iso3 text not null check (passport_iso3 ~ '^[A-Z]{3}$'),
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

create unique index if not exists group_members_one_user_per_group on public.group_members(group_id, user_id) where user_id is not null;
create index if not exists group_members_group_id_idx on public.group_members(group_id);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.travel_groups(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists group_invites_member_id_idx on public.group_invites(member_id);

create table if not exists public.destination_votes (
  group_id uuid not null references public.travel_groups(id) on delete cascade,
  destination_iso3 text not null check (destination_iso3 ~ '^[A-Z]{3}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, destination_iso3, user_id)
);

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  passport_iso3 text not null check (passport_iso3 ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, passport_iso3)
);

create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  origin_iso3 text not null check (origin_iso3 ~ '^[A-Z]{3}$'),
  destination_iso3 text not null check (destination_iso3 ~ '^[A-Z]{3}$'),
  purpose text not null default 'tourism',
  trip_days integer not null check (trip_days between 1 and 365),
  departure_date date,
  transit_iso3 text check (transit_iso3 is null or transit_iso3 ~ '^[A-Z]{3}$'),
  saved_at timestamptz not null default now(),
  unique (user_id, source_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists groups_touch_updated_at on public.travel_groups;
create trigger groups_touch_updated_at before update on public.travel_groups for each row execute function public.touch_updated_at();
drop trigger if exists votes_touch_updated_at on public.destination_votes;
create trigger votes_touch_updated_at before update on public.destination_votes for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(select 1 from public.travel_groups where id = target_group_id and owner_id = auth.uid());
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(select 1 from public.group_members where group_id = target_group_id and user_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.travel_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.destination_votes enable row level security;
alter table public.user_favorites enable row level security;
alter table public.saved_routes enable row level security;

create policy "profiles_select_self" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "groups_select_members" on public.travel_groups for select using (owner_id = auth.uid() or public.is_group_member(id));
create policy "groups_insert_owner" on public.travel_groups for insert with check (owner_id = auth.uid());
create policy "groups_update_owner" on public.travel_groups for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "groups_delete_owner" on public.travel_groups for delete using (owner_id = auth.uid());

create policy "members_select_group" on public.group_members for select using (public.is_group_owner(group_id) or public.is_group_member(group_id));
create policy "members_insert_owner" on public.group_members for insert with check (public.is_group_owner(group_id));
create policy "members_update_owner" on public.group_members for update using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
create policy "members_delete_owner" on public.group_members for delete using (public.is_group_owner(group_id));

create policy "invites_select_owner" on public.group_invites for select using (public.is_group_owner(group_id));
create policy "invites_insert_owner" on public.group_invites for insert with check (public.is_group_owner(group_id) and created_by = auth.uid());
create policy "invites_update_owner" on public.group_invites for update using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
create policy "invites_delete_owner" on public.group_invites for delete using (public.is_group_owner(group_id));

create policy "votes_select_members" on public.destination_votes for select using (public.is_group_member(group_id) or public.is_group_owner(group_id));
create policy "votes_insert_self" on public.destination_votes for insert with check (user_id = auth.uid() and public.is_group_member(group_id));
create policy "votes_update_self" on public.destination_votes for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_group_member(group_id));
create policy "votes_delete_self" on public.destination_votes for delete using (user_id = auth.uid());

create policy "favorites_all_self" on public.user_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "routes_all_self" on public.saved_routes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.claim_group_invite(raw_token text)
returns uuid
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  target_invite public.group_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_invite
  from public.group_invites
  where token_hash = encode(digest(raw_token, 'sha256'), 'hex')
    and used_at is null
    and revoked_at is null
    and expires_at > now()
  for update;
  if target_invite.id is null then raise exception 'Invite is invalid, expired, or already used'; end if;
  if exists(select 1 from public.group_members where group_id = target_invite.group_id and user_id = auth.uid()) then
    raise exception 'You already belong to this group';
  end if;
  update public.group_members set user_id = auth.uid() where id = target_invite.member_id and user_id is null;
  if not found then raise exception 'This member place has already been claimed'; end if;
  update public.group_invites set used_at = now() where id = target_invite.id;
  return target_invite.group_id;
end;
$$;

grant execute on function public.claim_group_invite(text) to authenticated;

create or replace function public.get_shared_group(raw_share_token uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'group', jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'preferences', g.preferences,
      'created_at', g.created_at,
      'updated_at', g.updated_at
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'display_name', m.display_name,
        'passport_iso3', m.passport_iso3,
        'role', m.role
      ) order by m.created_at)
      from public.group_members m where m.group_id = g.id
    ), '[]'::jsonb),
    'votes', coalesce((
      select jsonb_agg(jsonb_build_object('destination_iso3', v.destination_iso3, 'value', v.value))
      from public.destination_votes v where v.group_id = g.id
    ), '[]'::jsonb)
  )
  from public.travel_groups g
  where g.share_token = raw_share_token;
$$;

grant execute on function public.get_shared_group(uuid) to anon, authenticated;
