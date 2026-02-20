-- Remove file type prefixes from config titles.
-- The UI shows file type badges, so prefixes like "SOUL.md —" are redundant.
-- Also update the h1 heading inside content to match.

begin;

-- SOUL.md configs
update configs set
  title = 'The Minimalist',
  content = replace(content, '# SOUL.md — The Minimalist', '# The Minimalist')
where id = '00000000-0000-0000-0000-000000000401';

update configs set
  title = 'The Teacher',
  content = replace(content, '# SOUL.md — The Teacher', '# The Teacher')
where id = '00000000-0000-0000-0000-000000000402';

update configs set
  title = 'The Pair Programmer',
  content = replace(content, '# SOUL.md — The Pair Programmer', '# The Pair Programmer')
where id = '00000000-0000-0000-0000-000000000403';

update configs set
  title = 'The Companion',
  content = replace(content, '# SOUL.md — The Companion', '# The Companion')
where id = '00000000-0000-0000-0000-000000000421';

update configs set
  title = 'The Butler',
  content = replace(content, '# SOUL.md — The Butler', '# The Butler')
where id = '00000000-0000-0000-0000-000000000422';

-- AGENTS.md configs
update configs set
  title = 'React + TypeScript',
  content = replace(content, '# AGENTS.md — React + TypeScript', '# React + TypeScript')
where id = '00000000-0000-0000-0000-000000000411';

update configs set
  title = 'Python + Django',
  content = replace(content, '# AGENTS.md — Python + Django', '# Python + Django')
where id = '00000000-0000-0000-0000-000000000412';

update configs set
  title = 'Secure Development Principles',
  content = replace(content, '# AGENTS.md — Secure Development Principles', '# Secure Development Principles')
where id = '00000000-0000-0000-0000-000000000413';

update configs set
  title = 'OpenClaw Workspace',
  content = replace(content, '# AGENTS.md — OpenClaw Workspace', '# OpenClaw Workspace')
where id = '00000000-0000-0000-0000-000000000423';

-- OpenClaw file type configs
update configs set
  title = 'Getting Started',
  content = replace(content, '# USER.md — Getting Started', '# Getting Started')
where id = '00000000-0000-0000-0000-000000000424';

update configs set
  title = 'Build Your Assistant',
  content = replace(content, '# IDENTITY.md — Build Your Assistant', '# Build Your Assistant')
where id = '00000000-0000-0000-0000-000000000425';

update configs set
  title = 'Environment Notes',
  content = replace(content, '# TOOLS.md — Environment Notes', '# Environment Notes')
where id = '00000000-0000-0000-0000-000000000426';

update configs set
  title = 'System Health Monitor',
  content = replace(content, '# HEARTBEAT.md — System Health', '# System Health Monitor')
where id = '00000000-0000-0000-0000-000000000427';

update configs set
  title = 'Memory Structure Template',
  content = replace(content, '# MEMORY.md — Memory Structure Template', '# Memory Structure Template')
where id = '00000000-0000-0000-0000-000000000428';

commit;
