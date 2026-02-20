-- Add INSERT policies for config_tools and config_tags.
-- Authenticated users need to insert into these junction tables
-- when submitting a config. The policy checks that the user owns
-- the config being tagged (author_id matches auth.uid()).

create policy "Users can insert config tools for own configs"
  on config_tools for insert
  with check (
    exists (
      select 1 from configs
      where configs.id = config_id
        and configs.author_id = auth.uid()
    )
  );

create policy "Users can insert config tags for own configs"
  on config_tags for insert
  with check (
    exists (
      select 1 from configs
      where configs.id = config_id
        and configs.author_id = auth.uid()
    )
  );
