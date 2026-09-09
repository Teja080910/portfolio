create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  name text not null default '',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked boolean not null default false
);

alter table public.api_tokens enable row level security;

drop policy if exists "api_tokens_select_own" on public.api_tokens;
create policy "api_tokens_select_own"
on public.api_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "api_tokens_insert_own" on public.api_tokens;
create policy "api_tokens_insert_own"
on public.api_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "api_tokens_update_own" on public.api_tokens;
create policy "api_tokens_update_own"
on public.api_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "api_tokens_delete_own" on public.api_tokens;
create policy "api_tokens_delete_own"
on public.api_tokens
for delete
to authenticated
using (auth.uid() = user_id);
