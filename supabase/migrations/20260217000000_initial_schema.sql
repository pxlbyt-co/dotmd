create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- tools
create table tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  website_url text,
  icon_slug text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- file types
create table file_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  default_path text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- tool/file type support matrix
create table tool_file_types (
  tool_id uuid references tools(id) on delete cascade,
  file_type_id uuid references file_types(id) on delete cascade,
  primary key (tool_id, file_type_id)
);

-- tags taxonomy
create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('framework', 'language', 'use_case')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- app users (mirrors auth.users ids)
create table users (
  id uuid primary key,
  github_username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- submitted configs
create table configs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  content text not null,
  file_type_id uuid references file_types(id) not null,
  author_id uuid references users(id),
  author_name text not null,
  license text not null default 'CC0' check (license in ('CC0', 'MIT', 'Apache-2.0')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- config/tool mapping
create table config_tools (
  config_id uuid references configs(id) on delete cascade,
  tool_id uuid references tools(id) on delete cascade,
  primary key (config_id, tool_id)
);

-- config/tag mapping
create table config_tags (
  config_id uuid references configs(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (config_id, tag_id)
);

-- authenticated tool-specific votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  config_id uuid references configs(id) on delete cascade not null,
  tool_id uuid references tools(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, config_id, tool_id)
);

-- anonymous helpful votes
create table anonymous_votes (
  id uuid primary key default gen_random_uuid(),
  config_id uuid references configs(id) on delete cascade not null,
  ip_hash text not null,
  created_at timestamptz default now(),
  unique (config_id, ip_hash)
);

-- indexes
create index idx_configs_status on configs(status);
create index idx_configs_published_at on configs(published_at desc);
create index idx_configs_file_type on configs(file_type_id);
create index idx_configs_search on configs using gin(search_vector);
create index idx_config_tools_tool on config_tools(tool_id);
create index idx_config_tags_tag on config_tags(tag_id);
create index idx_votes_config on votes(config_id);
create index idx_votes_config_tool on votes(config_id, tool_id);
create index idx_anonymous_votes_config on anonymous_votes(config_id);
create index idx_configs_title_trgm on configs using gin(title gin_trgm_ops);
create index idx_configs_description_trgm on configs using gin(description gin_trgm_ops);

-- row-level security
alter table configs enable row level security;
create policy "Published configs are public" on configs for select using (status = 'published');
create policy "Users can insert configs"
  on configs for insert
  with check (auth.uid() = author_id);
create policy "Users can view own pending configs"
  on configs for select
  using (auth.uid() = author_id);

alter table votes enable row level security;
create policy "Votes are publicly readable" on votes for select using (true);
create policy "Users can insert own votes"
  on votes for insert
  with check (auth.uid() = user_id);
create policy "Users can delete own votes"
  on votes for delete
  using (auth.uid() = user_id);

alter table anonymous_votes enable row level security;
create policy "Anonymous vote counts are public"
  on anonymous_votes for select
  using (true);

alter table tools enable row level security;
create policy "Tools are public" on tools for select using (true);

alter table file_types enable row level security;
create policy "File types are public" on file_types for select using (true);

alter table tool_file_types enable row level security;
create policy "Tool file types are public" on tool_file_types for select using (true);

alter table tags enable row level security;
create policy "Tags are public" on tags for select using (true);

alter table users enable row level security;
create policy "Users are publicly readable" on users for select using (true);
create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

alter table config_tools enable row level security;
create policy "Config tools are public" on config_tools for select using (true);

alter table config_tags enable row level security;
create policy "Config tags are public" on config_tags for select using (true);
