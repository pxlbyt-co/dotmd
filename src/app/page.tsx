import type { Metadata } from "next";
import Link from "next/link";

import type { ConfigCardData } from "@/components/configs/ConfigCard";
import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { SearchBar } from "@/components/search/SearchBar";
import { SITE_TAGLINE } from "@/lib/constants";

export const revalidate = 60;

type RawConfig = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author_name: string;
  file_type: {
    slug: string;
    name: string;
    default_path: string | null;
  } | null;
  tools: Array<{
    tool: {
      slug: string;
      name: string;
    } | null;
  }> | null;
  tags?: Array<{
    tag: {
      slug: string;
      name: string;
    } | null;
  }> | null;
  helpful_count?: Array<{ count: number | null }> | null;
};

type ToolItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

interface HomePageData {
  featured: ConfigCardData[];
  recent: ConfigCardData[];
  tools: ToolItem[];
}

function getHelpfulVotes(helpfulCount: RawConfig["helpful_count"]): number {
  if (!helpfulCount || helpfulCount.length === 0) {
    return 0;
  }

  return helpfulCount.reduce(
    (total, voteRow) => total + (voteRow.count ?? 0),
    0,
  );
}

function toConfigCardData(config: RawConfig): ConfigCardData {
  return {
    id: config.id,
    slug: config.slug,
    title: config.title,
    description: config.description,
    author_name: config.author_name,
    file_type: config.file_type
      ? {
          slug: config.file_type.slug,
          name: config.file_type.name,
        }
      : null,
    tools:
      config.tools
        ?.map((item) => item.tool)
        .filter((tool): tool is { slug: string; name: string } => Boolean(tool))
        .map((tool) => ({
          slug: tool.slug,
          name: tool.name,
        })) ?? [],
    total_votes: getHelpfulVotes(config.helpful_count),
  };
}

async function getHomepageData(): Promise<HomePageData> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { featured: [], recent: [], tools: [] };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const configSelect =
      "id, slug, title, description, author_name, file_type:file_types(slug, name, default_path), tools:config_tools(tool:tools(slug, name)), tags:config_tags(tag:tags(slug, name)), helpful_count:anonymous_votes(count)";

    const [allConfigsResult, toolsResult, activeToolSlugsResult] =
      await Promise.all([
        supabase
          .from("configs")
          .select(configSelect)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("tools")
          .select("id, slug, name, description")
          .order("sort_order"),
        supabase
          .from("config_tools")
          .select("tool:tools!inner(slug), config:configs!inner(status)")
          .eq("config.status", "published"),
      ]);

    if (allConfigsResult.error || toolsResult.error) {
      return { featured: [], recent: [], tools: [] };
    }

    const allRows = (allConfigsResult.data ?? []) as unknown as RawConfig[];
    const allCards = allRows.map(toConfigCardData);

    // Featured: top 6 by helpful votes (ties broken by publish date — already sorted)
    const featuredCards = [...allCards]
      .sort((a, b) => b.total_votes - a.total_votes)
      .slice(0, 6);
    const featuredSlugs = new Set(featuredCards.map((c) => c.slug));

    // Recent: newest 6 that aren't already in Featured
    const recentCards = allCards
      .filter((c) => !featuredSlugs.has(c.slug))
      .slice(0, 6);

    // Show tools that have at least one published config (queried independently)
    const toolSlugsWithConfigs = new Set(
      (activeToolSlugsResult.data ?? [])
        .map((row) => (row.tool as { slug: string } | null)?.slug)
        .filter(Boolean),
    );
    const activeTools = ((toolsResult.data ?? []) as ToolItem[]).filter((t) =>
      toolSlugsWithConfigs.has(t.slug),
    );

    return {
      featured: featuredCards,
      recent: recentCards,
      tools: activeTools,
    };
  } catch {
    return { featured: [], recent: [], tools: [] };
  }
}

export function generateMetadata(): Metadata {
  const title = `dotmd — ${SITE_TAGLINE}`;
  const description =
    "Discover AI config files, browse featured AGENTS.md templates, and explore configs by tool.";
  const url = "https://dotmd.directory";

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function HomePage() {
  const { featured, recent, tools } = await getHomepageData();

  const seen = new Set<string>();
  const itemListElements = [...featured, ...recent]
    .filter((c) => {
      if (seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    })
    .map((config, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: config.title,
      url: `https://dotmd.directory/${config.slug}`,
    }));

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "dotmd",
    description: SITE_TAGLINE,
    url: "https://dotmd.directory",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: itemListElements,
    },
  };

  const collectionPageJsonLdString = JSON.stringify(
    collectionPageJsonLd,
  ).replace(/</g, "\\u003c");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <script type="application/ld+json">{collectionPageJsonLdString}</script>
      <section className="flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-surface-1 px-3 py-1 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
          <span className="font-mono text-xs text-text-secondary uppercase tracking-widest">
            Registry Online
          </span>
        </div>
        <h1 className="mx-auto mt-2 max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          {SITE_TAGLINE}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-mono text-sm text-text-secondary sm:text-base leading-relaxed">
          <span className="text-accent-primary mr-2">&gt;</span>
          Browse, copy, and remix AGENTS.md, SOUL.md, USER.md, CLAUDE.md,
          .cursorrules, and more.
        </p>
        <div className="mx-auto mt-10 w-full max-w-2xl">
          <SearchBar />
        </div>
      </section>

      <section className="mt-20 sm:mt-28">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary mb-4">
          {"// Browse by Tool"}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tools.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border-default bg-bg-surface-0 px-6 py-8 text-center">
              <p className="font-mono text-xs text-text-secondary">
                No tools available yet.
              </p>
            </div>
          ) : (
            tools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col justify-between rounded-lg border border-border-default bg-bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/40 hover:bg-bg-surface-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base"
              >
                <h3 className="font-mono text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                  /{tool.name.toLowerCase()}
                </h3>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-20 sm:mt-28">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent-secondary mb-1">
              @curated
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
              Featured Configs
            </h2>
          </div>
          <Link
            href="/browse"
            className="font-mono text-xs text-accent-primary transition-colors hover:text-accent-primary-hover"
          >
            [View all]
          </Link>
        </div>
        <ConfigGrid
          configs={featured}
          emptyTitle="No featured configs yet"
          emptyDescription="As soon as published configs are available, featured picks will show up here."
        />
      </section>

      {recent.length > 0 ? (
        <section className="mt-20 sm:mt-28">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-info mb-1">
                @latest
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
                Recently Added
              </h2>
            </div>
            <Link
              href="/browse?sort=newest"
              className="font-mono text-xs text-accent-primary transition-colors hover:text-accent-primary-hover"
            >
              [View newest]
            </Link>
          </div>
          <ConfigGrid
            configs={recent}
            emptyTitle="No recent configs yet"
            emptyDescription="Once new configs are published, this section will update automatically."
          />
        </section>
      ) : null}

      <section className="mx-auto mt-20 max-w-xl sm:mt-28">
        <div className="rounded-lg border border-border-default bg-bg-surface-0 p-8">
          <p className="font-mono text-xs text-accent-primary mb-4 text-center">
            &gt; subscribe --newsletter
          </p>
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
