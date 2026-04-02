import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { FILE_TYPES, TOOLS } from "@/lib/catalog";
import { getPublishedConfigs } from "@/lib/configs";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

const toolListFormatter = new Intl.ListFormat("en", {
	style: "long",
	type: "conjunction",
});

function dedupe(values: string[]) {
	return [...new Set(values)];
}

function fallbackSupportedToolNames(fileTypeSlug: string) {
	const fileTypeFromCatalog = FILE_TYPES.find((entry) => entry.slug === fileTypeSlug);
	if (!fileTypeFromCatalog) {
		return [];
	}

	return dedupe(
		fileTypeFromCatalog.supported_tools
			.map((toolSlug) => TOOLS.find((entry) => entry.slug === toolSlug)?.name ?? toolSlug)
			.filter(Boolean),
	);
}

function toToolListLabel(toolNames: string[]) {
	if (toolNames.length === 0) {
		return "multiple AI tools";
	}

	if (toolNames.length <= 4) {
		return toolListFormatter.format(toolNames);
	}

	return `${toolListFormatter.format(toolNames.slice(0, 4))}, and more`;
}

export async function generateStaticParams() {
	return FILE_TYPES.map((ft) => ({ slug: ft.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const fileType = FILE_TYPES.find((ft) => ft.slug === slug);
	const url = `https://dotmd.directory/types/${slug}`;

	if (!fileType) {
		const title = `File type configs | ${SITE_NAME}`;
		const description = "Browse AGENTS.md and ANYTHING.md config files by file type.";

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

	let configCount = 0;
	let supportedToolNames = fallbackSupportedToolNames(fileType.slug);

	try {
		const supabase = await createClient();
		const { data: dbFileType } = await supabase
			.from("file_types")
			.select("id")
			.eq("slug", fileType.slug)
			.maybeSingle();

		if (dbFileType) {
			const [{ count }, { data: toolRows }] = await Promise.all([
				supabase
					.from("configs")
					.select("id", { count: "exact", head: true })
					.eq("status", "published")
					.eq("file_type_id", dbFileType.id),
				supabase
					.from("tool_file_types")
					.select("tool:tools(name)")
					.eq("file_type_id", dbFileType.id),
			]);

			configCount = count ?? 0;

			const dbToolNames = dedupe(
				(toolRows ?? [])
					.flatMap((item) => {
						const toolValue = item.tool;
						if (!toolValue) {
							return [] as string[];
						}

						return Array.isArray(toolValue)
							? toolValue.flatMap((tool) => (tool?.name ? [tool.name] : []))
							: toolValue.name
								? [toolValue.name]
								: [];
					})
					.filter(Boolean),
			);

			if (dbToolNames.length > 0) {
				supportedToolNames = dbToolNames;
			}
		}
	} catch {
		// Fall back to static catalog data when DB isn't available.
	}

	const title = `What is ${fileType.name}? Examples & Templates | ${SITE_NAME}`;
	const baseDescription = fileType.description
		? fileType.description.replace(/[.\s]+$/, "")
		: `a config file format used by ${toToolListLabel(supportedToolNames)}`;
	const description = `${fileType.name} is ${baseDescription}. Browse ${configCount} community examples for ${toToolListLabel(supportedToolNames)}. Copy, remix, and use in your project.`;

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

export default async function FileTypeLandingPage({ params }: PageProps) {
	const { slug } = await params;
	const supabase = await createClient();

	const { data: fileType, error: fileTypeError } = await supabase
		.from("file_types")
		.select("id, slug, name, description, default_path")
		.eq("slug", slug)
		.maybeSingle();

	if (fileTypeError) {
		throw new Error(`Failed to load file type: ${fileTypeError.message}`);
	}

	if (!fileType) {
		notFound();
	}

	const [{ data: toolRows, error: toolRowsError }, configs] = await Promise.all([
		supabase
			.from("tool_file_types")
			.select("tool:tools(slug, name)")
			.eq("file_type_id", fileType.id),
		getPublishedConfigs(supabase),
	]);

	if (toolRowsError) {
		throw new Error(`Failed to load file type tools: ${toolRowsError.message}`);
	}

	const filteredConfigs = configs.filter((config) => config.file_type?.slug === fileType.slug);
	const itemListElements = filteredConfigs.map((config, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: config.title,
		url: `https://dotmd.directory/${config.slug}`,
	}));

	const supportedToolNamesFromDb = dedupe(
		(toolRows ?? [])
			.flatMap((item) => {
				const toolValue = item.tool;
				if (!toolValue) {
					return [] as string[];
				}

				return Array.isArray(toolValue)
					? toolValue.flatMap((tool) => (tool?.name ? [tool.name] : []))
					: toolValue.name
						? [toolValue.name]
						: [];
			})
			.filter(Boolean),
	);

	const supportedToolNames =
		supportedToolNamesFromDb.length > 0
			? supportedToolNamesFromDb
			: fallbackSupportedToolNames(fileType.slug);
	const supportedToolsLabel = toToolListLabel(supportedToolNames);
	const purposeText = fileType.description
		? fileType.description.replace(/[.\s]+$/, "")
		: "a portable instruction format for AI coding tools";

	const collectionPageJsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${fileType.name} examples and templates — dotmd`,
		description: fileType.description ?? `Published configs for ${fileType.name}.`,
		url: `https://dotmd.directory/types/${fileType.slug}`,
		mainEntity: {
			"@type": "ItemList",
			itemListElement: itemListElements,
		},
	};

	const faqEntries = [
		{
			question: `What is ${fileType.name}?`,
			answer: `${fileType.name} is ${purposeText}.`,
		},
		{
			question: `Where does ${fileType.name} go in my project?`,
			answer: fileType.default_path
				? `Put ${fileType.name} at ${fileType.default_path} so supporting tools can detect it automatically.`
				: `Place ${fileType.name} in your repository root or tool-specific config location, depending on your setup.`,
		},
		{
			question: `Which tools support ${fileType.name}?`,
			answer:
				supportedToolNames.length > 0
					? `${fileType.name} is supported by ${supportedToolsLabel}.`
					: `${fileType.name} can be adapted for multiple AI tools depending on your workflow.`,
		},
		{
			question: `How can I use ${fileType.name} templates from dotmd?`,
			answer: `Browse ${filteredConfigs.length} published ${fileType.name} examples, copy what fits, then remix and version-control it in your own project.`,
		},
	];

	const faqPageJsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqEntries.map((entry) => ({
			"@type": "Question",
			name: entry.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: entry.answer,
			},
		})),
	};

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: "https://dotmd.directory/",
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Browse",
				item: "https://dotmd.directory/browse",
			},
			{
				"@type": "ListItem",
				position: 3,
				name: fileType.name,
				item: `https://dotmd.directory/types/${fileType.slug}`,
			},
		],
	};

	const collectionPageJsonLdString = JSON.stringify(collectionPageJsonLd).replace(/</g, "\\u003c");
	const faqPageJsonLdString = JSON.stringify(faqPageJsonLd).replace(/</g, "\\u003c");
	const breadcrumbJsonLdString = JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c");

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
			<script type="application/ld+json">{collectionPageJsonLdString}</script>
			<script type="application/ld+json">{faqPageJsonLdString}</script>
			<script type="application/ld+json">{breadcrumbJsonLdString}</script>
			<header className="space-y-3">
				<p className="text-sm font-medium uppercase tracking-wide text-accent-primary">File type</p>
				<h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
					{fileType.name}
				</h1>
				{fileType.description ? (
					<p className="max-w-3xl text-text-secondary">{fileType.description}</p>
				) : null}
				{fileType.default_path ? (
					<p className="inline-flex rounded-md border border-border-default bg-bg-surface-1 px-3 py-1 font-mono text-sm text-text-secondary">
						{fileType.default_path}
					</p>
				) : null}
			</header>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight text-text-primary">
					Configs for {fileType.name}
				</h2>
				<ConfigGrid
					configs={filteredConfigs}
					emptyTitle={`No ${fileType.name} configs yet`}
					emptyDescription="Published configs will show up here once the first submissions go live."
				/>
			</section>
		</div>
	);
}
