-- Update the trigger function handle_new_user() to also copy the `type` column
-- from auth.users.raw_user_meta_data when a new user is created (email or OAuth).
-- Default to 'user' if not provided.

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
    show,
    type
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
    true,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'type'), ''), 'user')
  )
  on conflict (email) do update
    set id = excluded.id,
        firstname = excluded.firstname,
        lastname = excluded.lastname,
        role = excluded.role,
        phone = excluded.phone,
        type = excluded.type,
        updated_at = now();

  return new;
end;
$$;
