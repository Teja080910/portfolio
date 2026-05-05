-- Update the handle_new_user function to include photo and handle updates
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  generated_username text;
  oauth_photo text;
begin
  -- Extract photo from OAuth metadata if available
  oauth_photo := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture',
    ''
  );

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
    photo,
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
    nullif(oauth_photo, ''),
    null,
    true
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        firstname = coalesce(nullif(trim(new.raw_user_meta_data ->> 'firstname'), ''), public.profiles.firstname),
        lastname = coalesce(nullif(trim(new.raw_user_meta_data ->> 'lastname'), ''), public.profiles.lastname),
        -- Only update photo if the current one is empty/null
        photo = coalesce(nullif(public.profiles.photo, ''), nullif(oauth_photo, ''), public.profiles.photo),
        updated_at = now();

  return new;
end;
$$;

-- Ensure the trigger runs on both INSERT and UPDATE
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert or update of raw_user_meta_data on auth.users
for each row
execute procedure public.handle_new_user();
