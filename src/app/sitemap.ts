import type { MetadataRoute } from "next";

import { FILE_TYPES, TAGS, TOOLS } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const BASE_URL = "https://dotmd.directory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const supabase = await createClient();

	const { data: configs } = await supabase
		.from("configs")
		.select("slug, published_at, updated_at")
		.eq("status", "published");

	const staticPages: MetadataRoute.Sitemap = [
		{ url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
		{
			url: `${BASE_URL}/browse`,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/submit`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];

	const configPages: MetadataRoute.Sitemap = (configs ?? []).map((config) => ({
		url: `${BASE_URL}/${config.slug}`,
		lastModified: new Date(config.published_at ?? config.updated_at ?? Date.now()),
		changeFrequency: "weekly" as const,
		priority: 0.8,
	}));

	const toolPages: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
		url: `${BASE_URL}/tools/${tool.slug}`,
		lastModified: new Date(),
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	const comboPages: MetadataRoute.Sitemap = TOOLS.flatMap((tool) =>
		TAGS.map((tag) => ({
			url: `${BASE_URL}/tools/${tool.slug}/${tag.slug}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.5,
		})),
	);

	const tagPages: MetadataRoute.Sitemap = TAGS.map((tag) => ({
		url: `${BASE_URL}/tags/${tag.slug}`,
		lastModified: new Date(),
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	const typePages: MetadataRoute.Sitemap = FILE_TYPES.map((fileType) => ({
		url: `${BASE_URL}/types/${fileType.slug}`,
		lastModified: new Date(),
		changeFrequency: "daily" as const,
		priority: 0.7,
	}));

	return [...staticPages, ...configPages, ...toolPages, ...comboPages, ...tagPages, ...typePages];
}
