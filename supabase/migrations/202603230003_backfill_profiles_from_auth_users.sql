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
select
  users.id,
  case
    when username_candidates.base_username = '' then 'user'
    else left(username_candidates.base_username, 18) || substr(replace(users.id::text, '-', ''), 1, 6)
  end,
  coalesce(users.email, ''),
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'firstname'), ''), 'New'),
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'lastname'), ''), 'User'),
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'role'), ''), 'Developer'),
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'phone'), ''), ''),
  null,
  true
from auth.users as users
cross join lateral (
  select lower(
    regexp_replace(
      coalesce(
        nullif(trim(users.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(users.email, 'user@example.com'), '@', 1),
        'user'
      ),
      '[^a-zA-Z0-9_]+',
      '',
      'g'
    )
  ) as base_username
) as username_candidates
on conflict (id) do update
  set email = excluded.email,
      firstname = excluded.firstname,
      lastname = excluded.lastname,
      role = excluded.role,
      phone = excluded.phone,
      updated_at = now();
