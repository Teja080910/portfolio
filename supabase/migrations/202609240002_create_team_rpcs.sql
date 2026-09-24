-- Public/workspace RPCs for folio teams. These run as security definer so public
-- team pages can expose only shared items (and limited member info) without
-- leaking private portfolio content through RLS row access.

-- ---------------------------------------------------------------------------
-- Public team portfolio: team + members + shared items
-- ---------------------------------------------------------------------------

create or replace function public.folio_get_team_portfolio(p_slug text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_team public.folio_teams%rowtype;
  v_members jsonb;
  v_sections jsonb;
begin
  select *
  into v_team
  from public.folio_teams
  where slug = lower(trim(coalesce(p_slug, '')))
    and show = true
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(m.member order by m.role_rank, m.joined_at), '[]'::jsonb)
  into v_members
  from (
    select
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'firstname', p.firstname,
        'lastname', p.lastname,
        'photo', p.photo,
        'role', tm.role,
        'jobRole', p.role,
        'type', p.type,
        'show', p.show,
        'joinedAt', tm.joined_at
      ) as member,
      case when tm.role = 'owner' then 0 else 1 end as role_rank,
      tm.joined_at
    from public.folio_team_members tm
    join public.profiles p on p.id = tm.user_id
    where tm.team_id = v_team.id
  ) m;

  select coalesce(jsonb_object_agg(sec.section, sec.items), '{}'::jsonb)
  into v_sections
  from (
    select
      tcs.section,
      jsonb_agg(e.elem order by tm.joined_at, e.ord) as items
    from public.folio_team_content_shares tcs
    join public.folio_team_members tm
      on tm.team_id = tcs.team_id
      and tm.user_id = tcs.user_id
    join public.portfolio_contents pc
      on pc.user_id = tcs.user_id
    cross join lateral jsonb_array_elements(
      coalesce(to_jsonb(pc) -> tcs.section, '[]'::jsonb)
    ) with ordinality as e(elem, ord)
    where tcs.team_id = v_team.id
      and e.elem ->> 'id' = tcs.item_id
      and coalesce((e.elem ->> 'show')::boolean, true)
    group by tcs.section
  ) sec;

  return jsonb_build_object(
    'team', jsonb_build_object(
      'id', v_team.id,
      'slug', v_team.slug,
      'name', v_team.name,
      'tagline', v_team.tagline,
      'description', v_team.description,
      'logo', v_team.logo,
      'ownerId', v_team.owner_id,
      'createdAt', v_team.created_at
    ),
    'members', v_members,
    'sections', v_sections
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Workspace member list (any active member can read)
-- ---------------------------------------------------------------------------

create or replace function public.folio_get_team_members(p_team_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.folio_is_team_member(p_team_id, auth.uid()) then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(m.member order by m.role_rank, m.joined_at), '[]'::jsonb)
  into v_result
  from (
    select
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'firstname', p.firstname,
        'lastname', p.lastname,
        'photo', p.photo,
        'role', tm.role,
        'jobRole', p.role,
        'type', p.type,
        'show', p.show,
        'joinedAt', tm.joined_at
      ) as member,
      case when tm.role = 'owner' then 0 else 1 end as role_rank,
      tm.joined_at
    from public.folio_team_members tm
    join public.profiles p on p.id = tm.user_id
    where tm.team_id = p_team_id
  ) m;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public team directory (explore page)
-- ---------------------------------------------------------------------------

create or replace function public.folio_get_public_teams()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(t.team order by t.created_at desc), '[]'::jsonb)
  from (
    select
      jsonb_build_object(
        'id', tm.id,
        'slug', tm.slug,
        'name', tm.name,
        'tagline', tm.tagline,
        'description', tm.description,
        'logo', tm.logo,
        'created_at', tm.created_at,
        'member_count', (
          select count(*)
          from public.folio_team_members m
          where m.team_id = tm.id
        )
      ) as team,
      tm.created_at
    from public.folio_teams tm
    where tm.show = true
  ) t;
$$;

-- ---------------------------------------------------------------------------
-- Invites: public lookup by raw token, authenticated accept
-- ---------------------------------------------------------------------------

create or replace function public.folio_get_team_invite(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, extensions
as $$
declare
  v_invite public.folio_team_invites%rowtype;
  v_team public.folio_teams%rowtype;
begin
  if p_token is null or length(p_token) < 16 then
    return null;
  end if;

  select *
  into v_invite
  from public.folio_team_invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  limit 1;

  if not found then
    return null;
  end if;

  select *
  into v_team
  from public.folio_teams
  where id = v_invite.team_id
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_invite.id,
    'email', v_invite.email,
    'expiresAt', v_invite.expires_at,
    'acceptedAt', v_invite.accepted_at,
    'revoked', v_invite.revoked,
    'valid', (
      v_invite.revoked = false
      and v_invite.accepted_at is null
      and v_invite.expires_at > now()
    ),
    'team', jsonb_build_object(
      'id', v_team.id,
      'slug', v_team.slug,
      'name', v_team.name,
      'logo', v_team.logo
    )
  );
end;
$$;

create or replace function public.folio_accept_team_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite public.folio_team_invites%rowtype;
  v_uid uuid := auth.uid();
  v_email text;
  v_slug text;
begin
  if v_uid is null then
    raise exception 'You need to sign in to accept this invite.';
  end if;

  select *
  into v_invite
  from public.folio_team_invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  limit 1;

  if not found then
    raise exception 'Invite not found.';
  end if;

  if v_invite.revoked then
    raise exception 'This invite has been revoked.';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'This invite has already been used.';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'This invite has expired.';
  end if;

  if v_invite.email is not null then
    select email into v_email from auth.users where id = v_uid;

    if v_email is null or lower(v_email) <> lower(v_invite.email) then
      raise exception 'This invite was sent to a different email address.';
    end if;
  end if;

  insert into public.folio_team_members (team_id, user_id, role)
  values (v_invite.team_id, v_uid, 'member')
  on conflict (team_id, user_id) do nothing;

  update public.folio_team_invites
  set accepted_at = now()
  where id = v_invite.id;

  select slug into v_slug from public.folio_teams where id = v_invite.team_id;

  return jsonb_build_object(
    'teamId', v_invite.team_id,
    'slug', v_slug
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Pending invites for the signed-in user (matched by email)
-- ---------------------------------------------------------------------------

create or replace function public.folio_get_my_pending_invites()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_result jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select email into v_email from auth.users where id = v_uid;

  if v_email is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(x.invite order by x.created_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      jsonb_build_object(
        'id', i.id,
        'teamId', i.team_id,
        'email', i.email,
        'expiresAt', i.expires_at,
        'createdAt', i.created_at,
        'team', jsonb_build_object(
          'id', t.id,
          'slug', t.slug,
          'name', t.name,
          'logo', t.logo
        )
      ) as invite,
      i.created_at
    from public.folio_team_invites i
    join public.folio_teams t on t.id = i.team_id
    where lower(i.email) = lower(v_email)
      and i.revoked = false
      and i.accepted_at is null
      and i.expires_at > now()
      and not exists (
        select 1
        from public.folio_team_members tm
        where tm.team_id = i.team_id
          and tm.user_id = v_uid
      )
  ) x;

  return v_result;
end;
$$;

grant execute on function public.folio_get_team_portfolio(text) to anon, authenticated;
grant execute on function public.folio_get_team_members(uuid) to authenticated;
grant execute on function public.folio_get_public_teams() to anon, authenticated;
grant execute on function public.folio_get_team_invite(text) to anon, authenticated;
grant execute on function public.folio_accept_team_invite(text) to authenticated;
grant execute on function public.folio_get_my_pending_invites() to authenticated;
