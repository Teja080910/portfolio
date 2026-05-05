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
    photo,
    show
  )
  values (
    new.id,
    generated_username,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'firstname'), ''), nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'New'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'lastname'), ''), 'User'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'Developer'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), ''),
    null,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''), nullif(trim(new.raw_user_meta_data ->> 'picture'), '')),
    true
  )
  on conflict (email) do update
    set id = excluded.id,
        firstname = excluded.firstname,
        lastname = excluded.lastname,
        role = excluded.role,
        phone = excluded.phone,
        photo = coalesce(public.profiles.photo, excluded.photo),
        updated_at = now();

  return new;
end;
$$;
