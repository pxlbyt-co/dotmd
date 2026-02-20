import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400;

const CACHE_CONTROL_HEADER = "s-maxage=86400";

type ConfigRow = {
	id: string;
	slug: string;
	title: string;
	description: string;
	content: string;
	author_name: string;
	license: string;
	published_at: string | null;
	file_type: {
		slug: string;
		name: string;
	} | null;
};

type ConfigToolRow = {
	config_id: string;
	tool: {
		slug: string;
		name: string;
	} | null;
};

type ConfigTagRow = {
	config_id: string;
	tag: {
		slug: string;
		name: string;
	} | null;
};

type ApiConfig = {
	slug: string;
	title: string;
	description: string;
	content: string;
	file_type: {
		slug: string;
		name: string;
	};
	author_name: string;
	license: string;
	tools: Array<{ slug: string; name: string }>;
	tags: Array<{ slug: string; name: string }>;
	total_votes: number;
	published_at: string;
};

function parseTimestamp(value: string) {
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export async function GET() {
	const generatedAt = new Date().toISOString();

	try {
		const supabase = await createClient();
		const [configsResponse, toolsResponse, tagsResponse] = await Promise.all([
			supabase
				.from("configs")
				.select(
					"id, slug, title, description, content, author_name, license, published_at, file_type:file_types(slug, name)",
				)
				.eq("status", "published"),
			supabase.from("config_tools").select("config_id, tool:tools(slug, name)"),
			supabase.from("config_tags").select("config_id, tag:tags(slug, name)"),
		]);

		if (configsResponse.error || toolsResponse.error || tagsResponse.error) {
			return NextResponse.json({ error: "failed to load configs" }, { status: 503 });
		}

		const configToolsById = new Map<string, ApiConfig["tools"]>();
		for (const row of (toolsResponse.data ?? []) as ConfigToolRow[]) {
			if (!row.tool) {
				continue;
			}

			const current = configToolsById.get(row.config_id) ?? [];
			current.push(row.tool);
			configToolsById.set(row.config_id, current);
		}

		const configTagsById = new Map<string, ApiConfig["tags"]>();
		for (const row of (tagsResponse.data ?? []) as ConfigTagRow[]) {
			if (!row.tag) {
				continue;
			}

			const current = configTagsById.get(row.config_id) ?? [];
			current.push(row.tag);
			configTagsById.set(row.config_id, current);
		}

		const configs = ((configsResponse.data ?? []) as ConfigRow[])
			.map((config) => {
				if (!config.file_type) {
					return null;
				}

				return {
					slug: config.slug,
					title: config.title,
					description: config.description,
					content: config.content,
					file_type: {
						slug: config.file_type.slug,
						name: config.file_type.name,
					},
					author_name: config.author_name,
					license: config.license,
					tools: configToolsById.get(config.id) ?? [],
					tags: configTagsById.get(config.id) ?? [],
					// TODO: Wire up real vote totals once T-014 voting infrastructure is live.
					total_votes: 0,
					published_at: config.published_at ?? "",
				};
			})
			.filter((entry): entry is ApiConfig => Boolean(entry))
			.sort((a, b) => parseTimestamp(b.published_at) - parseTimestamp(a.published_at));

		return NextResponse.json(
			{ configs, generated_at: generatedAt },
			{
				headers: {
					"Cache-Control": CACHE_CONTROL_HEADER,
				},
			},
		);
	} catch {
		return NextResponse.json({ error: "configs unavailable" }, { status: 503 });
	}
}
