import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigContent } from "@/components/configs/ConfigContent";
import { InstallPaths } from "@/components/configs/InstallPaths";
import { HelpfulButton } from "@/components/votes/HelpfulButton";
import { VoteButton } from "@/components/votes/VoteButton";
import { GITHUB_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ConfigWithRelations } from "@/types";

export const revalidate = 300;

type PageProps = {
	params: Promise<{ slug: string }>;
};

type ConfigQueryResult = {
	id: string;
	slug: string;
	title: string;
	description: string;
	content: string;
	author_name: string;
	license: "CC0" | "MIT" | "Apache-2.0";
	source_url: string | null;
	status: "pending" | "published" | "rejected";
	published_at: string | null;
	file_type: {
		slug: string;
		name: string;
		description: string | null;
		default_path: string | null;
	} | null;
	author: {
		github_username: string;
		avatar_url: string | null;
	} | null;
	tools: Array<{
		tool_id: string;
		tool: {
			slug: string;
			name: string;
		} | null;
	}> | null;
	tags: Array<{
		tag: {
			slug: string;
			name: string;
			category: "framework" | "language" | "use_case";
		} | null;
	}> | null;
};

const configSelect = `
	id, slug, title, description, content, author_name, license, source_url, status, published_at,
	file_type:file_types(slug, name, description, default_path),
	author:users(github_username, avatar_url),
	tools:config_tools(tool_id, tool:tools(slug, name)),
	tags:config_tags(tag:tags(slug, name, category))
`;

const publishedDateFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
});

function normalizeConfig(config: ConfigQueryResult): ConfigWithRelations {
	return {
		id: config.id,
		slug: config.slug,
		title: config.title,
		description: config.description,
		content: config.content,
		author_name: config.author_name,
		license: config.license,
		source_url: config.source_url,
		status: config.status,
		published_at: config.published_at,
		file_type: {
			slug: config.file_type?.slug ?? "unknown",
			name: config.file_type?.name ?? "Unknown file",
			description: config.file_type?.description ?? null,
			default_path: config.file_type?.default_path ?? null,
		},
		author: config.author,
		tools:
			config.tools
				?.map((entry) => entry.tool)
				.filter((tool): tool is { slug: string; name: string } => Boolean(tool)) ?? [],
		tags:
			config.tags
				?.map((entry) => entry.tag)
				.filter(
					(
						tag,
					): tag is {
						slug: string;
						name: string;
						category: "framework" | "language" | "use_case";
					} => Boolean(tag),
				) ?? [],
		helpful_count: 0,
		tool_votes: [],
		total_votes: 0,
	};
}

async function fetchConfigBySlug(slug: string): Promise<ConfigQueryResult | null> {
	const supabase = await createClient();
	const { data: config } = await supabase
		.from("configs")
		.select(configSelect)
		.eq("slug", slug)
		.eq("status", "published")
		.single<ConfigQueryResult>();

	return config;
}

async function getConfigBySlug(slug: string): Promise<ConfigWithRelations | null> {
	const config = await fetchConfigBySlug(slug);

	if (!config) {
		return null;
	}

	return normalizeConfig(config);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const config = await getConfigBySlug(slug);

	if (!config) {
		const title = "Config not found | dotmd";
		const description = "This config does not exist or is not published.";
		const url = `https://dotmd.directory/${slug}`;

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

	const title = `${config.title} | dotmd`;
	const description = config.description;
	const url = `https://dotmd.directory/${config.slug}`;

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

export default async function ConfigDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const configResult = await fetchConfigBySlug(slug);

	if (!configResult) {
		notFound();
	}

	const config = normalizeConfig(configResult);
	const supabase = await createClient();

	const [{ count: helpfulCount }, { data: voteRows }, { data: authData }] = await Promise.all([
		supabase
			.from("anonymous_votes")
			.select("*", { count: "exact", head: true })
			.eq("config_id", config.id),
		supabase.from("votes").select("tool_id").eq("config_id", config.id),
		supabase.auth.getUser(),
	]);

	const toolVoteCounts = new Map<string, number>();
	for (const voteRow of voteRows ?? []) {
		toolVoteCounts.set(voteRow.tool_id, (toolVoteCounts.get(voteRow.tool_id) ?? 0) + 1);
	}

	const user = authData.user;
	const isLoggedIn = Boolean(user);
	let userVotedToolIds: string[] = [];

	if (user) {
		const { data: userVotes } = await supabase
			.from("votes")
			.select("tool_id")
			.eq("config_id", config.id)
			.eq("user_id", user.id);

		userVotedToolIds = (userVotes ?? []).map((voteRow) => voteRow.tool_id);
	}

	const userVotedToolIdSet = new Set(userVotedToolIds);
	const toolVoteData = new Map(
		(configResult.tools ?? [])
			.filter((entry): entry is { tool_id: string; tool: { slug: string; name: string } } =>
				Boolean(entry.tool),
			)
			.map((entry) => [
				entry.tool.slug,
				{
					toolId: entry.tool_id,
					count: toolVoteCounts.get(entry.tool_id) ?? 0,
					userVoted: userVotedToolIdSet.has(entry.tool_id),
				},
			]),
	);

	const authorLabel = config.author?.github_username
		? `@${config.author.github_username}`
		: config.author_name;
	const publishedLabel = config.published_at
		? publishedDateFormatter.format(new Date(config.published_at))
		: "Not published";
	const configUrl = `https://dotmd.directory/${config.slug}`;
	const creativeWorkJsonLd = {
		"@context": "https://schema.org",
		"@type": "CreativeWork",
		name: config.title,
		description: config.description,
		url: configUrl,
		license: config.license,
		author: {
			"@type": "Person",
			name: config.author_name,
		},
		publisher: {
			"@type": "Organization",
			name: "dotmd",
			url: GITHUB_URL,
		},
		datePublished: config.published_at ?? undefined,
		keywords: [config.file_type.name, ...config.tools.map((tool) => tool.name)],
		text: config.content,
	};

	const creativeWorkJsonLdString = JSON.stringify(creativeWorkJsonLd).replace(/</g, "\\u003c");

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
			<script type="application/ld+json">{creativeWorkJsonLdString}</script>
			<article className="space-y-10">
				<header className="space-y-6 border-b border-border-default pb-8">
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-text-tertiary mb-4">
							<span className="font-mono text-xs uppercase tracking-widest">
								{"// Config Record"}
							</span>
						</div>
						<h1 className="font-mono text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
							<span className="text-accent-primary mr-3">&gt;</span>
							{config.title}
						</h1>
						<p className="max-w-3xl font-mono text-sm leading-relaxed text-text-secondary sm:text-base pl-6">
							{config.description}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-6 pl-6 text-xs font-mono text-text-secondary">
						<div className="flex items-center gap-2">
							<span className="text-accent-secondary">author:</span>
							<div className="flex items-center gap-2">
								{config.author?.avatar_url ? (
									<span
										role="img"
										aria-label={authorLabel}
										className="h-5 w-5 rounded-[4px] border border-border-subtle bg-cover bg-center"
										style={{
											backgroundImage: `url(${config.author.avatar_url})`,
										}}
									/>
								) : null}
								<span className="text-text-primary">{authorLabel}</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-accent-secondary">license:</span>
							<span className="rounded border border-border-subtle bg-bg-surface-0 px-1.5 py-0.5 text-text-primary">
								{config.license}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-accent-secondary">published:</span>
							<span className="text-text-primary">{publishedLabel}</span>
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
					<div className="space-y-10 lg:col-span-2">
						<section className="space-y-4">
							<InstallPaths
								tools={config.tools}
								fileTypeName={config.file_type.name}
								defaultPath={config.file_type.default_path}
							/>
						</section>

						<section className="space-y-4">
							<div className="flex items-center gap-2">
								<span className="font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary">
									{"// File Content"}
								</span>
							</div>
							<ConfigContent content={config.content} fileName={config.file_type.name} />
						</section>
					</div>

					<aside className="space-y-8">
						<section className="rounded-lg border border-border-default bg-bg-surface-0 p-5 shadow-sm">
							<h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary">
								{"// Environment"}
							</h3>
							<div className="space-y-5">
								<div>
									<p className="mb-3 font-mono text-xs text-text-secondary">Target Tools:</p>
									<div className="flex flex-wrap gap-2">
										{config.tools.map((tool) => (
											<Link
												key={tool.slug}
												href={`/tools/${tool.slug}`}
												className="rounded border border-border-subtle bg-bg-surface-1 px-2.5 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-accent-primary/50 hover:text-accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
											>
												{tool.name}
											</Link>
										))}
									</div>
								</div>
								<div>
									<p className="mb-3 font-mono text-xs text-text-secondary">Keywords:</p>
									<div className="flex flex-wrap gap-2">
										{config.tags.map((tag) => (
											<Link
												key={tag.slug}
												href={`/tags/${tag.slug}`}
												className="rounded border border-border-subtle bg-bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-border-default hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
											>
												{tag.name}
											</Link>
										))}
									</div>
								</div>
							</div>
						</section>

						<section className="rounded-lg border border-border-default bg-bg-surface-0 p-5 shadow-sm">
							<div className="mb-4 space-y-1 border-b border-border-subtle pb-4">
								<h3 className="font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary">
									{"// Diagnostics"}
								</h3>
								<div className="mt-4 flex items-center justify-between gap-3">
									<p className="font-mono text-xs text-text-secondary">Helpful rating:</p>
									<HelpfulButton configId={config.id} count={helpfulCount ?? 0} />
								</div>
							</div>
							<div className="space-y-4">
								<p className="font-mono text-xs text-text-secondary">Verified compatible with:</p>
								<div className="flex flex-wrap gap-2">
									{config.tools.map((tool) => {
										const voteData = toolVoteData.get(tool.slug);
										if (!voteData) {
											return null;
										}

										return (
											<VoteButton
												key={tool.slug}
												configId={config.id}
												toolId={voteData.toolId}
												toolName={tool.name}
												count={voteData.count}
												userVoted={voteData.userVoted}
												isLoggedIn={isLoggedIn}
											/>
										);
									})}
								</div>
							</div>
						</section>
					</aside>
				</div>
			</article>
		</div>
	);
}
