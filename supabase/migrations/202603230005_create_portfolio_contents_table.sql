create table if not exists public.portfolio_contents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  about jsonb not null default '{}'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certificates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.portfolio_contents to authenticated;

alter table public.portfolio_contents enable row level security;

drop policy if exists "portfolio_contents_select_own" on public.portfolio_contents;
create policy "portfolio_contents_select_own"
on public.portfolio_contents
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "portfolio_contents_insert_own" on public.portfolio_contents;
create policy "portfolio_contents_insert_own"
on public.portfolio_contents
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "portfolio_contents_update_own" on public.portfolio_contents;
create policy "portfolio_contents_update_own"
on public.portfolio_contents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_portfolio_contents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_portfolio_contents_updated_at on public.portfolio_contents;
create trigger trg_portfolio_contents_updated_at
before update on public.portfolio_contents
for each row
execute procedure public.set_portfolio_contents_updated_at();
