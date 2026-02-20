# dotmd

The **ANYTHING.md** directory — a browsable, searchable directory for AI coding assistant config files.

Browse, copy, and remix AGENTS.md, CLAUDE.md, .cursorrules, SOUL.md, and more — across every AI coding tool.

**Live at:** [dotmd.directory](https://dotmd.directory)

## What is dotmd?

Every AI coding tool has its own config format — `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `copilot-instructions.md`, `.windsurfrules`, `GEMINI.md`, `.clinerules`, `SOUL.md`, and more. dotmd is the place to discover, share, and remix all of them.

- **Browse** configs by tool, file type, framework, and use case
- **Copy** with one click and see exactly where to install them
- **Vote** on what works — tool-specific upvotes, not just generic likes
- **Submit** your own configs via web form or GitHub PR

## Tech Stack

- **Framework:** Next.js 15 (App Router) with Bun
- **Database + Auth:** Supabase (PostgreSQL + GitHub OAuth)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Linting:** Biome
- **Search:** PostgreSQL full-text search + trigram

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2+)
- A [Supabase](https://supabase.com/) project (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/pxlbyt-co/dotmd.git
cd dotmd

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and other values

# Run database migrations
bunx supabase db push

# Start the dev server
bun run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (e.g., `http://localhost:3000`) |
| `REVALIDATION_SECRET` | Secret for ISR webhook revalidation |

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── actions/        # Server actions (next-safe-action)
├── components/     # React components
├── lib/            # Utilities, Supabase clients, constants
└── types/          # TypeScript types

supabase/
└── migrations/     # Database migrations
```

## Contributing

Contributions welcome! Whether it's submitting configs, improving the codebase, or fixing bugs:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Open a PR

For config submissions, the easiest path is the web form at [dotmd.directory/submit](https://dotmd.directory/submit).

## License

AGPL-3.0 — see [LICENSE](LICENSE)
