grant select on public.portfolio_contents to anon;

drop policy if exists "portfolio_contents_public_read_visible_profiles" on public.portfolio_contents;
create policy "portfolio_contents_public_read_visible_profiles"
on public.portfolio_contents
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = public.portfolio_contents.user_id
      and public.profiles.show = true
  )
);
