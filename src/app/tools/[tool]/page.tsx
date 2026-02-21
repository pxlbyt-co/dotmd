import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { TOOLS } from "@/lib/catalog";
import { getPublishedConfigs } from "@/lib/configs";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type PageProps = {
	params: Promise<{
		tool: string;
	}>;
};

export async function generateStaticParams() {
	return TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { tool: slug } = await params;
	const tool = TOOLS.find((item) => item.slug === slug);
	const url = `https://dotmd.directory/tools/${slug}`;

	if (!tool) {
		const title = "Tool configs | dotmd";
		const description = "Browse AGENTS.md and ANYTHING.md config files by tool.";

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

	const title = `Best Config Files for ${tool.name} | dotmd`;
	const description =
		tool.description ??
		`Browse the best AGENTS.md, SOUL.md, and other config files for ${tool.name}.`;

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

export default async function ToolLandingPage({ params }: PageProps) {
	const { tool: slug } = await params;
	const supabase = await createClient();

	const { data: tool, error: toolError } = await supabase
		.from("tools")
		.select("id, slug, name, description, website_url")
		.eq("slug", slug)
		.maybeSingle();

	if (toolError) {
		throw new Error(`Failed to load tool: ${toolError.message}`);
	}

	if (!tool) {
		notFound();
	}

	const [{ data: toolFileTypes, error: fileTypeError }, configs] = await Promise.all([
		supabase
			.from("tool_file_types")
			.select("file_type:file_types(slug, name, default_path)")
			.eq("tool_id", tool.id),
		getPublishedConfigs(supabase),
	]);

	if (fileTypeError) {
		throw new Error(`Failed to load tool file types: ${fileTypeError.message}`);
	}

	const filteredConfigs = configs.filter((config) =>
		config.tools.some((configTool) => configTool.slug === tool.slug),
	);

	const supportedFileTypes = (toolFileTypes ?? [])
		.flatMap((item) => (item.file_type ? [item.file_type] : []))
		.sort((a, b) => a.name.localeCompare(b.name));
	const itemListElements = filteredConfigs.map((config, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: config.title,
		url: `https://dotmd.directory/${config.slug}`,
	}));
	const collectionPageJsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tool.name} configs | dotmd`,
		description: tool.description ?? `Published configs for ${tool.name}.`,
		url: `https://dotmd.directory/tools/${tool.slug}`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: itemListElements,
		},
	};
	const collectionPageJsonLdString = JSON.stringify(collectionPageJsonLd).replace(/</g, "\\u003c");

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
			<script type="application/ld+json">{collectionPageJsonLdString}</script>
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-wide text-accent-primary">Tool</p>
				<h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
					{tool.name}
				</h1>
				{tool.description ? (
					<p className="max-w-3xl text-text-secondary">{tool.description}</p>
				) : null}
				{tool.website_url ? (
					<Link
						href={tool.website_url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex text-sm text-accent-primary underline-offset-4 hover:underline"
					>
						Official website
					</Link>
				) : null}
			</header>

			<section className="space-y-3 rounded-lg border border-border-default bg-bg-surface-1 p-5">
				<h2 className="text-lg font-semibold text-text-primary">Supported config file types</h2>
				{supportedFileTypes.length > 0 ? (
					<ul className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
						{supportedFileTypes.map((fileType) => (
							<li key={fileType.slug} className="rounded-md border border-border-default p-3">
								<p className="font-medium text-text-primary">{fileType.name}</p>
								{fileType.default_path ? (
									<p className="mt-1 font-mono text-xs text-text-tertiary">
										{fileType.default_path}
									</p>
								) : null}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-text-secondary">No file types registered yet for this tool.</p>
				)}
			</section>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight text-text-primary">
					Configs for {tool.name}
				</h2>
				{filteredConfigs.length > 0 ? (
					<ConfigGrid configs={filteredConfigs} />
				) : (
					<p className="text-text-secondary">No published configs yet for this tool.</p>
				)}
			</section>
		</div>
	);
}
