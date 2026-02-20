-- Automatically create a public.users row when a new auth.users row is created.
-- This keeps the public.users table in sync with Supabase Auth without
-- requiring application-level upserts in every action that references users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, github_username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'preferred_username', new.raw_user_meta_data ->> 'user_name', 'unknown'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'preferred_username', new.raw_user_meta_data ->> 'user_name', 'Unknown'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    github_username = excluded.github_username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

-- Fire after insert on auth.users (new signups)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fire after update on auth.users (profile changes, re-auth)
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_new_user();
