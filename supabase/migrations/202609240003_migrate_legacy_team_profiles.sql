-- Legacy single-user team accounts (profiles.type = 'team') become real teams:
--   * a folio_teams row is created (slug = username, owner = the profile)
--   * the owner gets an owner membership
--   * all existing portfolio items are auto-shared to the team
--   * the profile becomes a personal 'user' profile so the portfolio is kept
--
-- This migration is idempotent and safe to run when there are no team profiles.

do $$
declare
  p record;
  v_team_id uuid;
  v_section text;
  v_sections text[] := array[
    'skills',
    'projects',
    'experience',
    'education',
    'certificates',
    'content_channels',
    'content_works',
    'collaborations',
    'creator_tools'
  ];
begin
  for p in select * from public.profiles where type = 'team' loop
    select id into v_team_id from public.folio_teams where slug = p.username limit 1;

    if v_team_id is null then
      insert into public.folio_teams (owner_id, slug, name, tagline, description, logo, show)
      values (
        p.id,
        p.username,
        coalesce(nullif(trim(concat_ws(' ', p.firstname, p.lastname)), ''), p.username),
        p.role,
        p.description,
        p.photo,
        coalesce(p.show, true)
      )
      on conflict (slug) do nothing
      returning id into v_team_id;

      if v_team_id is null then
        insert into public.folio_teams (owner_id, slug, name, tagline, description, logo, show)
        values (
          p.id,
          left(p.username, 24) || '-' || substr(replace(p.id::text, '-', ''), 1, 6),
          coalesce(nullif(trim(concat_ws(' ', p.firstname, p.lastname)), ''), p.username),
          p.role,
          p.description,
          p.photo,
          coalesce(p.show, true)
        )
        returning id into v_team_id;
      end if;
    end if;

    if v_team_id is null then
      continue;
    end if;

    insert into public.folio_team_members (team_id, user_id, role)
    values (v_team_id, p.id, 'owner')
    on conflict (team_id, user_id) do update set role = 'owner';

    foreach v_section in array v_sections loop
      insert into public.folio_team_content_shares (team_id, user_id, section, item_id)
      select v_team_id, pc.user_id, v_section, item ->> 'id'
      from public.portfolio_contents pc
      cross join lateral jsonb_array_elements(
        coalesce(to_jsonb(pc) -> v_section, '[]'::jsonb)
      ) as item
      where pc.user_id = p.id
        and coalesce(item ->> 'id', '') <> ''
      on conflict (team_id, user_id, section, item_id) do nothing;
    end loop;

    update public.profiles
    set type = 'user',
        updated_at = now()
    where id = p.id
      and type = 'team';
  end loop;
end $$;
