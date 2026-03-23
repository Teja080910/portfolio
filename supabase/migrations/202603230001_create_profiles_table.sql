create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  firstname text not null,
  lastname text not null,
  role text not null,
  phone text not null,
  password text not null,
  photo text,
  description text,
  gitlink text,
  likedlin text,
  resumelink text,
  show boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
