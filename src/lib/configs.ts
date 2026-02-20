import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export type ConfigListItem = {
	id: string;
	slug: string;
	title: string;
	description: string;
	author_name: string;
	published_at: string | null;
	created_at: string | null;
	file_type: {
		slug: string;
		name: string;
		default_path: string | null;
	} | null;
	tools: Array<{
		slug: string;
		name: string;
	}>;
	tags: Array<{
		slug: string;
		name: string;
		category: "framework" | "language" | "use_case";
	}>;
	total_votes: number;
};

type ConfigBaseRow = {
	id: string;
	slug: string;
	title: string;
	description: string;
	author_name: string;
	published_at: string | null;
	created_at: string | null;
	file_type: {
		slug: string;
		name: string;
		default_path: string | null;
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
		category: "framework" | "language" | "use_case";
	} | null;
};

export async function getPublishedConfigs(
	supabase: SupabaseClient<Database>,
): Promise<ConfigListItem[]> {
	const [configsResponse, toolsResponse, tagsResponse] = await Promise.all([
		supabase
			.from("configs")
			.select(
				"id, slug, title, description, author_name, published_at, created_at, file_type:file_types(slug, name, default_path)",
			)
			.eq("status", "published"),
		supabase.from("config_tools").select("config_id, tool:tools(slug, name)"),
		supabase.from("config_tags").select("config_id, tag:tags(slug, name, category)"),
	]);

	if (configsResponse.error) {
		throw new Error(`Failed to load published configs: ${configsResponse.error.message}`);
	}

	if (toolsResponse.error) {
		throw new Error(`Failed to load config tools: ${toolsResponse.error.message}`);
	}

	if (tagsResponse.error) {
		throw new Error(`Failed to load config tags: ${tagsResponse.error.message}`);
	}

	const configToolsById = new Map<string, ConfigListItem["tools"]>();
	for (const row of (toolsResponse.data ?? []) as ConfigToolRow[]) {
		if (!row.tool) {
			continue;
		}

		const current = configToolsById.get(row.config_id) ?? [];
		current.push(row.tool);
		configToolsById.set(row.config_id, current);
	}

	const configTagsById = new Map<string, ConfigListItem["tags"]>();
	for (const row of (tagsResponse.data ?? []) as ConfigTagRow[]) {
		if (!row.tag) {
			continue;
		}

		const current = configTagsById.get(row.config_id) ?? [];
		current.push(row.tag);
		configTagsById.set(row.config_id, current);
	}

	return ((configsResponse.data ?? []) as ConfigBaseRow[])
		.map((config) => ({
			...config,
			tools: configToolsById.get(config.id) ?? [],
			tags: configTagsById.get(config.id) ?? [],
			total_votes: 0,
		}))
		.sort((a, b) => {
			const first = new Date(b.published_at ?? b.created_at ?? 0).getTime();
			const second = new Date(a.published_at ?? a.created_at ?? 0).getTime();
			return first - second;
		});
}
