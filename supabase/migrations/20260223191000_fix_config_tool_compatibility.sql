-- Clean up invalid config/tool links and assert compatibility.
--
-- Rule: every config_tools row must be valid for the config's file type,
-- i.e. (tool_id, configs.file_type_id) must exist in tool_file_types.

begin;

-- 1) Remove any existing invalid config_tools links.
delete from config_tools ct
using configs c
left join tool_file_types tft
  on tft.tool_id = ct.tool_id
 and tft.file_type_id = c.file_type_id
where ct.config_id = c.id
  and tft.tool_id is null;

-- 2) Assert database has no invalid config_tools links.
do $$
declare
  invalid_count int;
begin
  select count(*)
    into invalid_count
  from config_tools ct
  join configs c
    on c.id = ct.config_id
  left join tool_file_types tft
    on tft.tool_id = ct.tool_id
   and tft.file_type_id = c.file_type_id
  where tft.tool_id is null;

  if invalid_count > 0 then
    raise exception 'config_tools compatibility assertion failed: % invalid rows remain', invalid_count;
  end if;
end $$;

commit;
