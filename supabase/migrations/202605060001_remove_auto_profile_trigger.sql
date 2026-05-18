-- Remove the automatic profile creation trigger so profiles are only
-- created through explicit sign-up flows (not on every auth.users insert).

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user();
