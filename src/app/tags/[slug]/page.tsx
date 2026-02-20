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

	if (!tag) {
		return { title: `Tag configs | ${SITE_NAME}` };
	}

	return {
		title: `${tag.name} Templates | ${SITE_NAME}`,
		description: `Browse the best AGENTS.md and ANYTHING.md config files tagged with ${tag.name}.`,
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

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
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
