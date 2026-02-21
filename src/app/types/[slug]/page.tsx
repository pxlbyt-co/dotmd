import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { FILE_TYPES } from "@/lib/catalog";
import { getPublishedConfigs } from "@/lib/configs";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

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

	const title = `${fileType.name} examples and templates — ${SITE_NAME}`;
	const description =
		fileType.description ??
		`Browse the best AGENTS.md and ANYTHING.md config files for ${fileType.name}.`;

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

	const configs = await getPublishedConfigs(supabase);
	const filteredConfigs = configs.filter((config) => config.file_type?.slug === fileType.slug);
	const itemListElements = filteredConfigs.map((config, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: config.title,
		url: `https://dotmd.directory/${config.slug}`,
	}));
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
	const collectionPageJsonLdString = JSON.stringify(collectionPageJsonLd).replace(/</g, "\\u003c");

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
			<script type="application/ld+json">{collectionPageJsonLdString}</script>
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
