-- Teams: separate entities owned by a user, with members and per-item content shares.
-- Tables are namespaced with `folio_` because this Supabase instance can be shared
-- with other local projects that already own generic `teams` / `team_members` tables.

create extension if not exists pgcrypto;

create table if not exists public.folio_teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null default '',
  tagline text,
  description text,
  logo text,
  show boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.folio_team_members (
  team_id uuid not null references public.folio_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.folio_team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.folio_teams(id) on delete cascade,
  email text,
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.folio_team_content_shares (
  team_id uuid not null references public.folio_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (
    section in (
      'skills',
      'projects',
      'experience',
      'education',
      'certificates',
      'content_channels',
      'content_works',
      'collaborations',
      'creator_tools'
    )
  ),
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id, section, item_id)
);

create index if not exists folio_team_members_user_id_idx on public.folio_team_members (user_id);
create index if not exists folio_team_invites_team_id_idx on public.folio_team_invites (team_id);
create index if not exists folio_team_invites_email_idx on public.folio_team_invites (lower(email));
create index if not exists folio_team_content_shares_team_id_idx on public.folio_team_content_shares (team_id);

-- ---------------------------------------------------------------------------
-- Helpers (security definer avoids recursive RLS lookups between teams and
-- team_members policies)
-- ---------------------------------------------------------------------------

create or replace function public.folio_is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.folio_team_members
    where team_id = p_team_id
      and user_id = p_user_id
  );
$$;

create or replace function public.folio_is_team_owner(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.folio_teams
    where id = p_team_id
      and owner_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Owner membership is created automatically with the team
-- ---------------------------------------------------------------------------

create or replace function public.folio_handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.folio_team_members (team_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (team_id, user_id) do update set role = 'owner';

  return new;
end;
$$;

drop trigger if exists folio_on_team_created on public.folio_teams;
create trigger folio_on_team_created
after insert on public.folio_teams
for each row
execute procedure public.folio_handle_new_team();

create or replace function public.folio_set_teams_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists folio_trg_teams_updated_at on public.folio_teams;
create trigger folio_trg_teams_updated_at
before update on public.folio_teams
for each row
execute procedure public.folio_set_teams_updated_at();

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------

grant select on public.folio_teams to anon, authenticated;
grant insert, update, delete on public.folio_teams to authenticated;
grant select, insert, update, delete on public.folio_team_members to authenticated;
grant select, insert, update, delete on public.folio_team_invites to authenticated;
grant select, insert, update, delete on public.folio_team_content_shares to authenticated;

alter table public.folio_teams enable row level security;
alter table public.folio_team_members enable row level security;
alter table public.folio_team_invites enable row level security;
alter table public.folio_team_content_shares enable row level security;

drop policy if exists "folio_teams_select_visible_or_member" on public.folio_teams;
create policy "folio_teams_select_visible_or_member"
on public.folio_teams
for select
to anon, authenticated
using (
  show = true
  or owner_id = auth.uid()
  or public.folio_is_team_member(id, auth.uid())
);

drop policy if exists "folio_teams_insert_own" on public.folio_teams;
create policy "folio_teams_insert_own"
on public.folio_teams
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "folio_teams_update_owner" on public.folio_teams;
create policy "folio_teams_update_owner"
on public.folio_teams
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "folio_teams_delete_owner" on public.folio_teams;
create policy "folio_teams_delete_owner"
on public.folio_teams
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "folio_team_members_select_member" on public.folio_team_members;
create policy "folio_team_members_select_member"
on public.folio_team_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.folio_is_team_member(team_id, auth.uid())
);

drop policy if exists "folio_team_members_insert_owner" on public.folio_team_members;
create policy "folio_team_members_insert_owner"
on public.folio_team_members
for insert
to authenticated
with check (public.folio_is_team_owner(team_id, auth.uid()));

drop policy if exists "folio_team_members_delete_owner_or_self" on public.folio_team_members;
create policy "folio_team_members_delete_owner_or_self"
on public.folio_team_members
for delete
to authenticated
using (
  role <> 'owner'
  and (
    public.folio_is_team_owner(team_id, auth.uid())
    or user_id = auth.uid()
  )
);

drop policy if exists "folio_team_invites_select_owner" on public.folio_team_invites;
create policy "folio_team_invites_select_owner"
on public.folio_team_invites
for select
to authenticated
using (public.folio_is_team_owner(team_id, auth.uid()));

drop policy if exists "folio_team_invites_insert_owner" on public.folio_team_invites;
create policy "folio_team_invites_insert_owner"
on public.folio_team_invites
for insert
to authenticated
with check (public.folio_is_team_owner(team_id, auth.uid()));

drop policy if exists "folio_team_invites_update_owner" on public.folio_team_invites;
create policy "folio_team_invites_update_owner"
on public.folio_team_invites
for update
to authenticated
using (public.folio_is_team_owner(team_id, auth.uid()))
with check (public.folio_is_team_owner(team_id, auth.uid()));

drop policy if exists "folio_team_invites_delete_owner" on public.folio_team_invites;
create policy "folio_team_invites_delete_owner"
on public.folio_team_invites
for delete
to authenticated
using (public.folio_is_team_owner(team_id, auth.uid()));

drop policy if exists "folio_team_content_shares_select_own_or_member" on public.folio_team_content_shares;
create policy "folio_team_content_shares_select_own_or_member"
on public.folio_team_content_shares
for select
to authenticated
using (
  user_id = auth.uid()
  or public.folio_is_team_member(team_id, auth.uid())
);

drop policy if exists "folio_team_content_shares_insert_own" on public.folio_team_content_shares;
create policy "folio_team_content_shares_insert_own"
on public.folio_team_content_shares
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.folio_is_team_member(team_id, auth.uid())
);

drop policy if exists "folio_team_content_shares_delete_own" on public.folio_team_content_shares;
create policy "folio_team_content_shares_delete_own"
on public.folio_team_content_shares
for delete
to authenticated
using (user_id = auth.uid());
