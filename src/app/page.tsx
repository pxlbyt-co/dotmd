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

	return helpfulCount.reduce((total, voteRow) => total + (voteRow.count ?? 0), 0);
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
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		return { featured: [], recent: [], tools: [] };
	}

	try {
		const { createClient } = await import("@/lib/supabase/server");
		const supabase = await createClient();

		const configSelect =
			"id, slug, title, description, author_name, file_type:file_types(slug, name, default_path), tools:config_tools(tool:tools(slug, name)), tags:config_tags(tag:tags(slug, name)), helpful_count:anonymous_votes(count)";

		const [allConfigsResult, toolsResult, activeToolSlugsResult] = await Promise.all([
			supabase
				.from("configs")
				.select(configSelect)
				.eq("status", "published")
				.order("published_at", { ascending: false })
				.limit(20),
			supabase.from("tools").select("id, slug, name, description").order("sort_order"),
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
		const featuredCards = [...allCards].sort((a, b) => b.total_votes - a.total_votes).slice(0, 6);
		const featuredSlugs = new Set(featuredCards.map((c) => c.slug));

		// Recent: newest 6 that aren't already in Featured
		const recentCards = allCards.filter((c) => !featuredSlugs.has(c.slug)).slice(0, 6);

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

	const itemListElements = [...featured, ...recent].map((config, index) => ({
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
		hasPart: itemListElements,
	};

	const collectionPageJsonLdString = JSON.stringify(collectionPageJsonLd).replace(/</g, "\\u003c");

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			<script type="application/ld+json">{collectionPageJsonLdString}</script>
			<section className="text-center">
				<p className="text-base font-semibold uppercase tracking-[0.2em] text-accent-primary">
					dotmd
				</p>
				<h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
					{SITE_TAGLINE}
				</h1>
				<p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary sm:text-lg">
					Browse, copy, and remix AGENTS.md, SOUL.md, USER.md, CLAUDE.md, .cursorrules, and more.
				</p>
				<div className="mx-auto mt-8 w-full max-w-2xl">
					<SearchBar />
				</div>
				<div className="mx-auto mt-6 h-px w-16 bg-accent-primary" />
			</section>

			<section className="mt-12 border-y border-border-subtle py-8 sm:mt-16">
				<p className="text-xs font-medium uppercase tracking-widest text-accent-primary">Explore</p>
				<h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
					Browse by Tool
				</h2>
				<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{tools.length === 0 ? (
						<div className="col-span-full rounded-xl border border-dashed border-border-default bg-bg-surface-1 px-6 py-12 text-center">
							<p className="text-sm text-text-secondary">
								No tools available yet. Published tools will appear here.
							</p>
						</div>
					) : (
						tools.map((tool) => (
							<Link
								key={tool.id}
								href={`/tools/${tool.slug}`}
								className="rounded-xl border border-border-default border-l-accent-primary border-l-2 bg-bg-surface-1 p-4 transition-all duration-150 ease-in-out hover:-translate-y-px hover:border-border-strong hover:border-l-accent-primary-hover hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
							>
								<h3 className="text-base font-semibold text-text-primary">{tool.name}</h3>
								<p className="mt-1 line-clamp-2 text-sm text-text-secondary">
									{tool.description ?? "Browse configs for this tool."}
								</p>
							</Link>
						))
					)}
				</div>
			</section>

			<section className="mt-12 sm:mt-16">
				<div className="mb-6 flex items-center justify-between gap-4">
					<div>
						<p className="text-xs font-medium uppercase tracking-widest text-accent-secondary">
							Curated
						</p>
						<h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
							Featured
						</h2>
					</div>
					<Link
						href="/browse"
						className="text-sm font-medium text-accent-primary transition-colors duration-150 ease-in-out hover:text-accent-primary-hover"
					>
						Browse all
					</Link>
				</div>
				<ConfigGrid
					configs={featured}
					emptyTitle="No featured configs yet"
					emptyDescription="As soon as published configs are available, featured picks will show up here."
				/>
			</section>

			{recent.length > 0 ? (
				<section className="mt-12 sm:mt-16">
					<div className="mb-6 flex items-center justify-between gap-4">
						<div>
							<p className="text-xs font-medium uppercase tracking-widest text-info">Latest</p>
							<h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
								Recently Added
							</h2>
						</div>
						<Link
							href="/browse?sort=newest"
							className="text-sm font-medium text-accent-primary transition-colors duration-150 ease-in-out hover:text-accent-primary-hover"
						>
							View newest
						</Link>
					</div>
					<ConfigGrid
						configs={recent}
						emptyTitle="No recent configs yet"
						emptyDescription="Once new configs are published, this section will update automatically."
					/>
				</section>
			) : null}

			<section className="mx-auto mt-12 max-w-xl sm:mt-16">
				<NewsletterSignup />
			</section>
		</div>
	);
}
