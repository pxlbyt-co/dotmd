-- Email subscribers for newsletter / new config notifications
create table if not exists email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- RLS: anyone can subscribe, nobody can read the list
alter table email_subscribers enable row level security;
create policy "Anyone can subscribe" on email_subscribers for insert with check (true);
