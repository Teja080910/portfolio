-- Team titles: the owner can set anyone's title, and members can set their own.
-- Only the `title` column is updatable by authenticated users so a member can
-- never change their membership role (owner/member) or move the row to another
-- team/user.

revoke update on public.folio_team_members from authenticated;
grant update (title) on public.folio_team_members to authenticated;

drop policy if exists "folio_team_members_update_owner" on public.folio_team_members;
drop policy if exists "folio_team_members_update_owner_or_self" on public.folio_team_members;
create policy "folio_team_members_update_owner_or_self"
on public.folio_team_members
for update
to authenticated
using (
  public.folio_is_team_owner(team_id, auth.uid())
  or user_id = auth.uid()
)
with check (
  public.folio_is_team_owner(team_id, auth.uid())
  or user_id = auth.uid()
);
