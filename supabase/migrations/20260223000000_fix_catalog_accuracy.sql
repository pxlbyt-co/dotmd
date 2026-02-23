-- Fix catalog accuracy for Google Jules, VS Code agent files, and Cursor project rules.
--
-- 1. Remove phantom JULES.md file type and map Google Jules to AGENTS.md.
-- 2. Rename VS Code .chatmode.md file type metadata to .agent.md.
-- 3. Add Cursor project-rules (.mdc) file type and support mapping.
-- 4. Convert 4 legacy .cursorrules configs to .cursor/rules (MDC) metadata/content.

begin;

-- 1a. Remove stale Google Jules -> JULES.md mapping
delete from tool_file_types
where tool_id = '00000000-0000-0000-0000-000000000107'      -- Google Jules
  and file_type_id = '00000000-0000-0000-0000-000000000207'; -- JULES.md

-- 1b. Remove JULES.md file type (no config rows reference it)
delete from file_types
where id = '00000000-0000-0000-0000-000000000207';

-- 1c. Add Google Jules -> AGENTS.md mapping
insert into tool_file_types (tool_id, file_type_id)
values (
  '00000000-0000-0000-0000-000000000107', -- Google Jules
  '00000000-0000-0000-0000-000000000201'  -- AGENTS.md
)
on conflict (tool_id, file_type_id) do nothing;

-- 1d. Update Google Jules description
update tools
set description = 'Google''s autonomous coding agent, configured via AGENTS.md.'
where id = '00000000-0000-0000-0000-000000000107';

-- 2. Rename VS Code chat mode file type metadata to .agent.md
update file_types
set slug = 'agent-md',
    name = '.agent.md',
    description = 'VS Code custom agent with persona, tools, and handoff configuration.',
    default_path = '.github/agents/'
where id = '00000000-0000-0000-0000-000000000214';

-- 3a. Add Cursor project rules (.mdc) file type
insert into file_types (id, slug, name, description, default_path, sort_order)
values (
  '00000000-0000-0000-0000-000000000220',
  'cursor-project-rules',
  '.cursor/rules (MDC)',
  'Cursor project rules with YAML frontmatter for scoped, composable instructions.',
  '.cursor/rules/',
  20
);

-- 3b. Map Cursor to the new project-rules file type
insert into tool_file_types (tool_id, file_type_id)
values (
  '00000000-0000-0000-0000-000000000101', -- Cursor
  '00000000-0000-0000-0000-000000000220'  -- .cursor/rules (MDC)
)
on conflict (tool_id, file_type_id) do nothing;

-- 4a. Remove .cursorrules file type — legacy format, no longer accepting submissions.
--     Configs are being migrated to cursor-project-rules below.
--     Must remove tool mapping first, then update configs, then delete the type.

-- Remove Cursor -> .cursorrules tool_file_types mapping
delete from tool_file_types
where tool_id = '00000000-0000-0000-0000-000000000101'      -- Cursor
  and file_type_id = '00000000-0000-0000-0000-000000000203'; -- .cursorrules

-- 4b. Convert 4 legacy .cursorrules configs to .cursor/rules (MDC)
--     Keep existing slugs (preserve URLs), prepend MDC frontmatter,
--     and update the top H1 from ".cursorrules" to "Cursor Rules".

update configs
set title = '.cursor/rules — Next.js + TypeScript + Tailwind CSS',
    description = 'Cursor project rules (MDC) for Next.js + TypeScript + Tailwind with App Router and server-action-first conventions.',
    file_type_id = '00000000-0000-0000-0000-000000000220',
    content =
      $mdc004$---
description: Next.js + TypeScript + Tailwind conventions for App Router and server-action-first workflows.
globs:
alwaysApply: true
---

$mdc004$
      || regexp_replace(content, '^# \\.cursorrules — ', '# Cursor Rules — ')
where id = '00000000-0000-0000-0000-000000000404';

update configs
set title = '.cursor/rules — React + TypeScript (Vite SPA)',
    description = 'Cursor project rules (MDC) for React + TypeScript Vite SPA projects with client-side data-fetching patterns.',
    file_type_id = '00000000-0000-0000-0000-000000000220',
    content =
      $mdc005$---
description: React + TypeScript Vite SPA conventions with React Router and TanStack Query patterns.
globs:
alwaysApply: true
---

$mdc005$
      || regexp_replace(content, '^# \\.cursorrules — ', '# Cursor Rules — ')
where id = '00000000-0000-0000-0000-000000000405';

update configs
set title = '.cursor/rules — Python + FastAPI',
    description = 'Cursor project rules (MDC) for FastAPI backends with layered architecture, SQLAlchemy 2.0, and pytest workflows.',
    file_type_id = '00000000-0000-0000-0000-000000000220',
    content =
      $mdc006$---
description: FastAPI backend conventions with typed services, SQLAlchemy 2.0, and pytest workflows.
globs:
alwaysApply: true
---

$mdc006$
      || regexp_replace(content, '^# \\.cursorrules — ', '# Cursor Rules — ')
where id = '00000000-0000-0000-0000-000000000406';

update configs
set title = '.cursor/rules — Rust CLI Applications',
    description = 'Cursor project rules (MDC) for Rust CLI apps using clap, thiserror/anyhow, tracing, and assert_cmd tests.',
    file_type_id = '00000000-0000-0000-0000-000000000220',
    content =
      $mdc007$---
description: Rust CLI conventions using clap, structured errors, tracing, and integration tests.
globs:
alwaysApply: true
---

$mdc007$
      || regexp_replace(content, '^# \\.cursorrules — ', '# Cursor Rules — ')
where id = '00000000-0000-0000-0000-000000000407';

-- 4c. Delete .cursorrules file type (all configs now migrated to cursor-project-rules)
delete from file_types
where id = '00000000-0000-0000-0000-000000000203';

commit;
