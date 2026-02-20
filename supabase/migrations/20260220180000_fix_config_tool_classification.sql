-- Fix tool classification for SOUL.md and OpenClaw AGENTS.md configs.
--
-- SOUL.md is an OpenClaw-only file type. Claude Code and OpenAI Codex
-- don't use it. The original seed tagged SOUL configs with those tools
-- before OpenClaw existed, and the OpenClaw migration added OpenClaw
-- without cleaning up the incorrect associations.
--
-- The OpenClaw AGENTS.md workspace config contains OpenClaw-specific
-- content (memory management, INBOX, HEARTBEAT, etc.) and shouldn't
-- appear on coding tool pages.

begin;

-- 1. Remove Claude Code (102) and OpenAI Codex (104) from all SOUL.md configs
--    Configs: Minimalist (401), Teacher (402), Pair Programmer (403),
--             Companion (421), Butler (422)
delete from config_tools
where tool_id in (
  '00000000-0000-0000-0000-000000000102',  -- Claude Code
  '00000000-0000-0000-0000-000000000104'   -- OpenAI Codex
)
and config_id in (
  '00000000-0000-0000-0000-000000000401',  -- Minimalist
  '00000000-0000-0000-0000-000000000402',  -- Teacher
  '00000000-0000-0000-0000-000000000403',  -- Pair Programmer
  '00000000-0000-0000-0000-000000000421',  -- Companion
  '00000000-0000-0000-0000-000000000422'   -- Butler
);

-- 2. Remove non-OpenClaw tools from the OpenClaw AGENTS.md workspace config (423)
--    Keep only OpenClaw (112)
delete from config_tools
where config_id = '00000000-0000-0000-0000-000000000423'
and tool_id != '00000000-0000-0000-0000-000000000112';  -- keep OpenClaw only

-- 3. Remove SOUL.md and IDENTITY.md from Claude Code's tool_file_types
--    These are OpenClaw file types, not Claude Code file types
delete from tool_file_types
where tool_id = '00000000-0000-0000-0000-000000000102'  -- Claude Code
and file_type_id in (
  '00000000-0000-0000-0000-000000000205',  -- SOUL.md
  '00000000-0000-0000-0000-000000000211'   -- IDENTITY.md
);

commit;
