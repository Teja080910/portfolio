alter table public.portfolio_contents
  add column if not exists content_channels jsonb not null default '[]'::jsonb,
  add column if not exists content_works jsonb not null default '[]'::jsonb,
  add column if not exists collaborations jsonb not null default '[]'::jsonb,
  add column if not exists creator_tools jsonb not null default '[]'::jsonb,
  add column if not exists template text not null default 'developer'::text;
