-- Per-team member titles (e.g. CEO, CTO, Developer). This is separate from the
-- member's global folio profile role; it is shown on team pages/API when set.

alter table public.folio_team_members
  add column if not exists title text;

-- Only the team owner can set member titles.
drop policy if exists "folio_team_members_update_owner" on public.folio_team_members;
create policy "folio_team_members_update_owner"
on public.folio_team_members
for update
to authenticated
using (public.folio_is_team_owner(team_id, auth.uid()))
with check (public.folio_is_team_owner(team_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- Refresh RPCs so they include the per-team title
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
        'title', tm.title,
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
        'title', tm.title,
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

grant execute on function public.folio_get_team_portfolio(text) to anon, authenticated;
grant execute on function public.folio_get_team_members(uuid) to authenticated;
