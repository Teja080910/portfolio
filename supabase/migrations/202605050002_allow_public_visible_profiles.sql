grant select on public.profiles to anon;

drop policy if exists "profiles_public_read_visible" on public.profiles;
create policy "profiles_public_read_visible"
on public.profiles
for select
to anon, authenticated
using (show = true);
