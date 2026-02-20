import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { TAGS, TOOLS } from "@/lib/catalog";
import { getPublishedConfigs } from "@/lib/configs";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

type PageProps = {
	params: Promise<{
		tool: string;
		tag: string;
	}>;
};

export async function generateStaticParams() {
	return TOOLS.flatMap((tool) => TAGS.map((tag) => ({ tool: tool.slug, tag: tag.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { tool: toolSlug, tag: tagSlug } = await params;
	const tool = TOOLS.find((entry) => entry.slug === toolSlug);
	const tag = TAGS.find((entry) => entry.slug === tagSlug);
	const url = `https://dotmd.directory/tools/${toolSlug}/${tagSlug}`;

	if (!tool || !tag) {
		const title = "Tool and tag configs | dotmd";
		const description = "Browse AGENTS.md and ANYTHING.md configs by tool and topic.";

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

	const title = `${tag.name} Config Files for ${tool.name} | dotmd`;
	const description = `Browse ${tag.name} focused config files for ${tool.name} — AGENTS.md, SOUL.md, and more.`;

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

export default async function ToolTagComboPage({ params }: PageProps) {
	const { tool: toolSlug, tag: tagSlug } = await params;
	const supabase = await createClient();

	const [{ data: tool, error: toolError }, { data: tag, error: tagError }] = await Promise.all([
		supabase.from("tools").select("id, slug, name, description").eq("slug", toolSlug).maybeSingle(),
		supabase.from("tags").select("id, slug, name, category").eq("slug", tagSlug).maybeSingle(),
	]);

	if (toolError) {
		throw new Error(`Failed to load tool for combo page: ${toolError.message}`);
	}

	if (tagError) {
		throw new Error(`Failed to load tag for combo page: ${tagError.message}`);
	}

	if (!tool || !tag) {
		notFound();
	}

	const configs = await getPublishedConfigs(supabase);
	const filteredConfigs = configs.filter((config) => {
		const hasTool = config.tools.some((configTool) => configTool.slug === tool.slug);
		const hasTag = config.tags.some((configTag) => configTag.slug === tag.slug);
		return hasTool && hasTag;
	});

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-wide text-accent-primary">
					Tool + Tag
				</p>
				<h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
					{tool.name} + {tag.name}
				</h1>
				<p className="max-w-3xl text-text-secondary">
					Published configs for <span className="text-text-primary">{tool.name}</span> focused on{" "}
					<span className="text-text-primary">{tag.name}</span>.
				</p>
			</header>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight text-text-primary">
					Matching configs
				</h2>
				{filteredConfigs.length > 0 ? (
					<ConfigGrid configs={filteredConfigs} />
				) : (
					<p className="text-text-secondary">
						No published configs yet for the {tool.name} + {tag.name} combination.
					</p>
				)}
			</section>
		</div>
	);
}
