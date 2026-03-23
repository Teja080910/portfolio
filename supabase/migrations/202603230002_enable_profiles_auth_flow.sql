alter table public.profiles
  alter column password drop not null;

grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  generated_username text;
begin
  base_username := lower(
    regexp_replace(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(new.email, 'user@example.com'), '@', 1),
        'user'
      ),
      '[^a-zA-Z0-9_]+',
      '',
      'g'
    )
  );

  if base_username = '' then
    base_username := 'user';
  end if;

  generated_username := left(base_username, 24);

  if exists (
    select 1
    from public.profiles
    where username = generated_username
      and email <> coalesce(new.email, '')
  ) then
    generated_username := left(base_username, 18) || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  insert into public.profiles (
    id,
    username,
    email,
    firstname,
    lastname,
    role,
    phone,
    password,
    show
  )
  values (
    new.id,
    generated_username,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'firstname'), ''), 'New'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'lastname'), ''), 'User'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'Developer'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), ''),
    null,
    true
  )
  on conflict (email) do update
    set id = excluded.id,
        firstname = excluded.firstname,
        lastname = excluded.lastname,
        role = excluded.role,
        phone = excluded.phone,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
