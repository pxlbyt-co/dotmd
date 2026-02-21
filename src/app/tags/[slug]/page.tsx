import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfigGrid } from "@/components/configs/ConfigGrid";
import { TAGS } from "@/lib/catalog";
import { getPublishedConfigs } from "@/lib/configs";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type PageProps = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return TAGS.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const tag = TAGS.find((item) => item.slug === slug);
	const url = `https://dotmd.directory/tags/${slug}`;

	if (!tag) {
		return { title: `Tag configs | ${SITE_NAME}` };
	}

	const title = `${tag.name} Templates | ${SITE_NAME}`;
	const description = `Browse the best AGENTS.md and ANYTHING.md config files tagged with ${tag.name}.`;

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

export default async function TagPage({ params }: PageProps) {
	const { slug } = await params;

	const tag = TAGS.find((item) => item.slug === slug);
	if (!tag) {
		notFound();
	}

	const supabase = await createClient();
	const allConfigs = await getPublishedConfigs(supabase);
	const filteredConfigs = allConfigs.filter((config) =>
		config.tags.some((configTag) => configTag.slug === tag.slug),
	);
	const itemListElements = filteredConfigs.map((config, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: config.title,
		url: `https://dotmd.directory/${config.slug}`,
	}));
	const collectionPageJsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tag.name} templates | dotmd`,
		description: `Published configs tagged with ${tag.name}.`,
		url: `https://dotmd.directory/tags/${tag.slug}`,
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
				<p className="text-sm font-medium uppercase tracking-wide text-accent-primary">Tag</p>
				<h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
					{tag.name}
				</h1>
				<p className="max-w-3xl text-text-secondary">
					Browse AGENTS.md and ANYTHING.md configs tagged with {tag.name}.
				</p>
			</header>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight text-text-primary">
					Configs for {tag.name}
				</h2>
				{filteredConfigs.length > 0 ? (
					<ConfigGrid configs={filteredConfigs} />
				) : (
					<p className="text-text-secondary">No published configs yet for this tag.</p>
				)}
			</section>
		</div>
	);
}
