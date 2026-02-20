-- Fix tool_file_types and config_tools accuracy.
--
-- 1. Claude Code does NOT natively support AGENTS.md.
--    Open feature request: github.com/anthropics/claude-code/issues/6235
--    Claude Code only reads CLAUDE.md. Remove AGENTS.md from its file types
--    and untag the 3 cross-tool AGENTS.md configs from Claude Code.
--
-- 2. OpenAI Codex does NOT use SOUL.md or IDENTITY.md.
--    Those are OpenClaw-only file types. Missed in the PR #7 fix
--    (which only removed them from Claude Code).

begin;

-- 1a. Remove AGENTS.md from Claude Code's supported file types
delete from tool_file_types
where tool_id = '00000000-0000-0000-0000-000000000102'    -- Claude Code
  and file_type_id = '00000000-0000-0000-0000-000000000201'; -- AGENTS.md

-- 1b. Remove Claude Code from the 3 cross-tool AGENTS.md configs
--     (React+TS, Python+Django, Secure Development)
delete from config_tools
where tool_id = '00000000-0000-0000-0000-000000000102'  -- Claude Code
  and config_id in (
    '00000000-0000-0000-0000-000000000411',  -- React + TypeScript
    '00000000-0000-0000-0000-000000000412',  -- Python + Django
    '00000000-0000-0000-0000-000000000413'   -- Secure Development
  );

-- 2. Remove SOUL.md and IDENTITY.md from OpenAI Codex's supported file types
delete from tool_file_types
where tool_id = '00000000-0000-0000-0000-000000000104'  -- OpenAI Codex
  and file_type_id in (
    '00000000-0000-0000-0000-000000000205',  -- SOUL.md
    '00000000-0000-0000-0000-000000000211'   -- IDENTITY.md
  );

commit;
