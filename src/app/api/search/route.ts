import { createClient } from "@/lib/supabase/server";
import type { ConfigSearchResult } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const SEARCH_SELECT =
	"id, slug, title, description, author_name, file_type:file_types(slug, name), tools:config_tools(tool:tools(slug, name)), tags:config_tags(tag:tags(slug, name))";

interface SearchConfigRow {
	id: string;
	slug: string;
	title: string;
	description: string;
	author_name: string;
	tools: Array<{
		tool: {
			slug: string;
			name: string;
		} | null;
	}>;
	tags: Array<{
		tag: {
			slug: string;
			name: string;
		} | null;
	}>;
}

function parsePositiveInt(value: string | null, fallback: number) {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function toSearchResult(row: SearchConfigRow): ConfigSearchResult {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		author_name: row.author_name,
		tools: row.tools.flatMap((entry) => (entry.tool ? [entry.tool] : [])),
		tags: row.tags.flatMap((entry) => (entry.tag ? [entry.tag] : [])),
		total_votes: 0,
	};
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.trim();
	const limit = Math.min(parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
	const offset = parsePositiveInt(searchParams.get("offset"), 0);

	if (!q) {
		return Response.json({ error: "query required" }, { status: 400 });
	}

	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("configs")
			.select(SEARCH_SELECT)
			.eq("status", "published")
			.textSearch("search_vector", q, { type: "websearch", config: "english" })
			.range(offset, offset + limit - 1);

		if (error) {
			return Response.json({ error: "search unavailable" }, { status: 503 });
		}

		const results = (data ?? []).map((row) => toSearchResult(row as SearchConfigRow));

		return Response.json({ results, total: results.length, query: q });
	} catch {
		return Response.json({ error: "search unavailable" }, { status: 503 });
	}
}
