alter table public.profiles
  add column if not exists type text not null default 'user'
  check (type in ('user', 'team', 'business'));
