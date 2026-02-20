import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigContent } from "@/components/configs/ConfigContent";
import { InstallPaths } from "@/components/configs/InstallPaths";
import { Badge } from "@/components/ui/badge";
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
	const softwareSourceCodeJsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareSourceCode",
		name: config.title,
		description: config.description,
		url: configUrl,
		codeRepository: GITHUB_URL,
		programmingLanguage: config.tools.map((tool) => tool.name),
		license: config.license,
		author: {
			"@type": "Person",
			name: config.author_name,
		},
		datePublished: config.published_at ?? undefined,
		codeSampleType: config.file_type.name,
		text: config.content,
	};

	const softwareSourceCodeJsonLdString = JSON.stringify(softwareSourceCodeJsonLd).replace(
		/</g,
		"\\u003c",
	);

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
			<script type="application/ld+json">{softwareSourceCodeJsonLdString}</script>
			<article className="space-y-8">
				<header className="space-y-4">
					<h1 className="text-h1 font-semibold text-text-primary">{config.title}</h1>
					<p className="max-w-3xl text-body text-text-secondary">{config.description}</p>
					<div className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
						{config.author?.avatar_url ? (
							<span
								role="img"
								aria-label={authorLabel}
								className="h-6 w-6 rounded-full border border-border-default bg-cover bg-center"
								style={{ backgroundImage: `url(${config.author.avatar_url})` }}
							/>
						) : null}
						<span>By {authorLabel}</span>
						<Badge variant="outline">{config.license}</Badge>
						<span>Published {publishedLabel}</span>
						{config.source_url ? (
							<a
								href={config.source_url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-accent-primary hover:underline"
							>
								View source ↗
							</a>
						) : null}
					</div>
				</header>

				<section className="space-y-3">
					<div className="flex flex-wrap gap-2">
						{config.tools.map((tool) => (
							<Badge key={tool.slug} variant="outline" asChild>
								<Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
							</Badge>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						{config.tags.map((tag) => (
							<Badge key={tag.slug} variant="secondary" asChild>
								<Link href={`/tags/${tag.slug}`}>
									{tag.name} · {tag.category.replace("_", " ")}
								</Link>
							</Badge>
						))}
					</div>
				</section>

				<InstallPaths
					tools={config.tools}
					fileTypeName={config.file_type.name}
					defaultPath={config.file_type.default_path}
				/>

				<section className="space-y-3">
					<h2 className="text-h3 font-semibold text-text-primary">Configuration</h2>
					<ConfigContent content={config.content} fileName={config.file_type.name} />
				</section>

				<section className="space-y-4 rounded-xl border border-border-default bg-bg-surface-1 p-4 sm:p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-h4 font-semibold text-text-primary">Community feedback</h2>
							<p className="text-body-sm text-text-secondary">
								{helpfulCount ?? 0} found this helpful
							</p>
						</div>
						<HelpfulButton configId={config.id} count={helpfulCount ?? 0} />
					</div>
					<div className="space-y-2">
						<p className="text-body-sm text-text-secondary">Works with:</p>
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
			</article>
		</div>
	);
}
