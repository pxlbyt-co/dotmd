import type { Metadata } from "next";
import Link from "next/link";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { type BrowseSort, FilterBar } from "@/components/filters/FilterBar";
import { Button } from "@/components/ui/button";
import type { TAG_CATEGORIES } from "@/lib/constants";
import type { ConfigSearchResult } from "@/types";

const PAGE_SIZE = 20;
const SORT_OPTIONS = ["popular", "newest", "alphabetical"] as const;
const DEFAULT_SORT: BrowseSort = "popular";

type SearchParams = {
	tool?: string | string[];
	tag?: string | string[];
	sort?: string | string[];
	page?: string | string[];
};

type PageProps = {
	searchParams?: Promise<SearchParams>;
};

type ToolOption = {
	id: string;
	slug: string;
	name: string;
};

type TagOption = {
	id: string;
	slug: string;
	name: string;
	category: (typeof TAG_CATEGORIES)[number];
};

type BrowseConfig = ConfigSearchResult & {
	published_at: string | null;
	helpful_count: number;
	file_type: { slug: string; name: string } | null;
};

type RawConfigRow = {
	id: string;
	slug: string;
	title: string;
	description: string;
	author_name: string;
	published_at: string | null;
	file_types: { slug: string; name: string } | { slug: string; name: string }[] | null;
	config_tools: Array<{
		tools: { slug: string; name: string } | { slug: string; name: string }[] | null;
	}> | null;
	config_tags: Array<{
		tags:
			| { slug: string; name: string; category: (typeof TAG_CATEGORIES)[number] }
			| { slug: string; name: string; category: (typeof TAG_CATEGORIES)[number] }[]
			| null;
	}> | null;
	votes: Array<{ id: string }> | null;
	anonymous_votes: Array<{ id: string }> | null;
};

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const title = "Browse configs | dotmd";
	const description =
		"Browse published AI config files by tool, tag, and popularity. Discover AGENTS.md, SOUL.md, and more.";
	const url = "https://dotmd.directory/browse";

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

function toSingleValue(value?: string | string[]) {
	if (Array.isArray(value)) {
		return value[0];
	}

	return value;
}

function parseSort(value?: string | string[]): BrowseSort {
	const single = toSingleValue(value);
	if (single && SORT_OPTIONS.includes(single as BrowseSort)) {
		return single as BrowseSort;
	}

	return DEFAULT_SORT;
}

function parsePage(value?: string | string[]) {
	const single = toSingleValue(value);
	const page = Number.parseInt(single ?? "1", 10);

	if (Number.isNaN(page) || page < 1) {
		return 1;
	}

	return page;
}

function normalizeToolRelation(
	relation: RawConfigRow["config_tools"],
): Array<{ slug: string; name: string }> {
	if (!relation) {
		return [];
	}

	const normalized: Array<{ slug: string; name: string }> = [];

	for (const { tools } of relation) {
		const values = Array.isArray(tools) ? tools : tools ? [tools] : [];
		for (const tool of values) {
			if (tool?.slug && tool?.name) {
				normalized.push({ slug: tool.slug, name: tool.name });
			}
		}
	}

	return normalized;
}

function normalizeTagRelation(
	relation: RawConfigRow["config_tags"],
): Array<{ slug: string; name: string }> {
	if (!relation) {
		return [];
	}

	const normalized: Array<{ slug: string; name: string }> = [];

	for (const { tags } of relation) {
		const values = Array.isArray(tags) ? tags : tags ? [tags] : [];
		for (const tag of values) {
			if (tag?.slug && tag?.name) {
				normalized.push({ slug: tag.slug, name: tag.name });
			}
		}
	}

	return normalized;
}

function sortConfigs(configs: BrowseConfig[], sort: BrowseSort) {
	const sorted = [...configs];

	sorted.sort((a, b) => {
		if (sort === "alphabetical") {
			return a.title.localeCompare(b.title);
		}

		if (sort === "newest") {
			const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
			const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
			return bDate - aDate;
		}

		if (b.total_votes !== a.total_votes) {
			return b.total_votes - a.total_votes;
		}

		const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
		const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
		return bDate - aDate;
	});

	return sorted;
}

function buildPageHref(params: { tool?: string; tag?: string; sort: BrowseSort; page: number }) {
	const search = new URLSearchParams();

	if (params.tool) {
		search.set("tool", params.tool);
	}

	if (params.tag) {
		search.set("tag", params.tag);
	}

	if (params.sort !== DEFAULT_SORT) {
		search.set("sort", params.sort);
	}

	if (params.page > 1) {
		search.set("page", String(params.page));
	}

	const query = search.toString();
	return query ? `/browse?${query}` : "/browse";
}

async function fetchBrowseData() {
	const hasSupabaseConfig = Boolean(
		process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);

	if (!hasSupabaseConfig) {
		return {
			tools: [] as ToolOption[],
			tags: [] as TagOption[],
			configs: [] as BrowseConfig[],
			error: "Database is not configured yet.",
		};
	}

	try {
		const { createClient } = await import("@/lib/supabase/server");
		const supabase = await createClient();

		const [toolsResult, tagsResult, configsResult] = await Promise.all([
			supabase.from("tools").select("id, slug, name").order("sort_order", { ascending: true }),
			supabase
				.from("tags")
				.select("id, slug, name, category")
				.order("category", { ascending: true })
				.order("name", { ascending: true }),
			supabase
				.from("configs")
				.select(
					"id, slug, title, description, author_name, published_at, file_types(slug, name), config_tools(tools(slug, name)), config_tags(tags(slug, name, category)), votes(id), anonymous_votes(id)",
				)
				.eq("status", "published"),
		]);

		if (toolsResult.error || tagsResult.error || configsResult.error) {
			return {
				tools: toolsResult.data ?? [],
				tags: tagsResult.data ?? [],
				configs: [] as BrowseConfig[],
				error:
					toolsResult.error?.message ||
					tagsResult.error?.message ||
					configsResult.error?.message ||
					"Unable to load browse data.",
			};
		}

		const configs = (configsResult.data as RawConfigRow[]).map((config) => {
			const tools = normalizeToolRelation(config.config_tools);
			const tags = normalizeTagRelation(config.config_tags);
			const helpfulCount = config.anonymous_votes?.length ?? 0;
			const voteCount = config.votes?.length ?? 0;

			const fileType = Array.isArray(config.file_types)
				? (config.file_types[0] ?? null)
				: (config.file_types ?? null);

			return {
				id: config.id,
				slug: config.slug,
				title: config.title,
				description: config.description,
				author_name: config.author_name,
				file_type: fileType,
				tools,
				tags,
				helpful_count: helpfulCount,
				total_votes: helpfulCount + voteCount,
				published_at: config.published_at,
			};
		});

		// Only show tools/tags that have at least one published config
		const toolSlugsWithConfigs = new Set(configs.flatMap((c) => c.tools.map((t) => t.slug)));
		const tagSlugsWithConfigs = new Set(configs.flatMap((c) => c.tags.map((t) => t.slug)));

		const activeTools = (toolsResult.data ?? []).filter((t) => toolSlugsWithConfigs.has(t.slug));
		const activeTags = ((tagsResult.data ?? []) as TagOption[]).filter((t) =>
			tagSlugsWithConfigs.has(t.slug),
		);

		return {
			tools: activeTools,
			tags: activeTags,
			configs,
			error: null,
		};
	} catch {
		return {
			tools: [] as ToolOption[],
			tags: [] as TagOption[],
			configs: [] as BrowseConfig[],
			error: "Unable to connect to the database.",
		};
	}
}

export default async function BrowsePage({ searchParams }: PageProps) {
	const resolvedSearchParams = await searchParams;

	const selectedTool = toSingleValue(resolvedSearchParams?.tool);
	const selectedTag = toSingleValue(resolvedSearchParams?.tag);
	const sort = parseSort(resolvedSearchParams?.sort);
	const requestedPage = parsePage(resolvedSearchParams?.page);

	const { tools, tags, configs, error } = await fetchBrowseData();

	const filteredConfigs = configs.filter((config) => {
		const matchesTool = selectedTool
			? config.tools.some((tool) => tool.slug === selectedTool)
			: true;
		const matchesTag = selectedTag ? config.tags.some((tag) => tag.slug === selectedTag) : true;
		return matchesTool && matchesTag;
	});

	const sortedConfigs = sortConfigs(filteredConfigs, sort);
	const totalPages = Math.max(1, Math.ceil(sortedConfigs.length / PAGE_SIZE));
	const currentPage = Math.min(requestedPage, totalPages);
	const start = (currentPage - 1) * PAGE_SIZE;
	const pageConfigs = sortedConfigs.slice(start, start + PAGE_SIZE);

	return (
		<div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8 space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight text-text-primary">Browse configs</h1>
				<p className="text-sm text-text-secondary">
					Discover published config files by tool, tag, and ranking.
				</p>
			</div>

			<FilterBar
				tools={tools}
				tags={tags}
				selectedTool={selectedTool}
				selectedTag={selectedTag}
				sort={sort}
			/>

			{error ? (
				<div className="mt-8 rounded-xl border border-border-default bg-bg-surface-1 p-6">
					<p className="text-sm text-text-secondary">{error}</p>
				</div>
			) : pageConfigs.length === 0 ? (
				<div className="mt-8 rounded-xl border border-border-default bg-bg-surface-1 p-10 text-center">
					<h2 className="text-lg font-semibold text-text-primary">No configs found</h2>
					<p className="mt-2 text-sm text-text-secondary">
						Try changing or clearing your filters to see more results.
					</p>
				</div>
			) : (
				<>
					<div className="mt-8 mb-4 text-sm text-text-secondary">
						Showing {start + 1}-{Math.min(start + PAGE_SIZE, sortedConfigs.length)} of{" "}
						{sortedConfigs.length} configs
					</div>
					<ConfigGrid configs={pageConfigs} />

					{totalPages > 1 ? (
						<nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4">
							{currentPage > 1 ? (
								<Button asChild variant="outline">
									<Link
										href={buildPageHref({
											tool: selectedTool,
											tag: selectedTag,
											sort,
											page: currentPage - 1,
										})}
									>
										Previous
									</Link>
								</Button>
							) : (
								<Button variant="outline" disabled>
									Previous
								</Button>
							)}
							<p className="text-sm text-text-secondary">
								Page {currentPage} of {totalPages}
							</p>
							{currentPage < totalPages ? (
								<Button asChild variant="outline">
									<Link
										href={buildPageHref({
											tool: selectedTool,
											tag: selectedTag,
											sort,
											page: currentPage + 1,
										})}
									>
										Next
									</Link>
								</Button>
							) : (
								<Button variant="outline" disabled>
									Next
								</Button>
							)}
						</nav>
					) : null}
				</>
			)}
		</div>
	);
}
