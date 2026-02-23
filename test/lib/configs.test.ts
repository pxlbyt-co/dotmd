import { describe, expect, test } from "bun:test";

import { getPublishedConfigs } from "../../src/lib/configs";

type ResponseShape<T> = {
	data: T[] | null;
	error: { message: string } | null;
};

function createSupabaseMock({
	configsResponse,
	toolsResponse,
	tagsResponse,
}: {
	configsResponse: ResponseShape<unknown>;
	toolsResponse: ResponseShape<unknown>;
	tagsResponse: ResponseShape<unknown>;
}) {
	const calls: Array<{ table: string; select: string; eq?: { column: string; value: string } }> = [];

	const supabase = {
		from(table: string) {
			return {
				select(select: string) {
					const call = { table, select };
					calls.push(call);

					if (table === "configs") {
						return {
							eq(column: string, value: string) {
								call.eq = { column, value };
								return Promise.resolve(configsResponse);
							},
						};
					}

					if (table === "config_tools") {
						return Promise.resolve(toolsResponse);
					}

					if (table === "config_tags") {
						return Promise.resolve(tagsResponse);
					}

					throw new Error(`Unexpected table: ${table}`);
				},
			};
		},
	};

	return { supabase, calls };
}

describe("getPublishedConfigs", () => {
	test("joins tools/tags, skips null relations, and sorts newest first", async () => {
		const { supabase, calls } = createSupabaseMock({
			configsResponse: {
				data: [
					{
						id: "cfg-1",
						slug: "cfg-1",
						title: "First",
						description: "First config",
						author_name: "arlo",
						published_at: "2026-02-20T10:00:00.000Z",
						created_at: "2026-02-19T10:00:00.000Z",
						file_type: { slug: "agents-md", name: "AGENTS.md", default_path: "AGENTS.md" },
					},
					{
						id: "cfg-2",
						slug: "cfg-2",
						title: "Second",
						description: "Second config",
						author_name: "justin",
						published_at: null,
						created_at: "2026-02-22T10:00:00.000Z",
						file_type: null,
					},
				],
				error: null,
			},
			toolsResponse: {
				data: [
					{ config_id: "cfg-1", tool: { slug: "cursor", name: "Cursor" } },
					{ config_id: "cfg-1", tool: null },
					{ config_id: "cfg-2", tool: { slug: "claude-code", name: "Claude Code" } },
				],
				error: null,
			},
			tagsResponse: {
				data: [
					{ config_id: "cfg-2", tag: { slug: "react", name: "React", category: "framework" } },
					{ config_id: "cfg-1", tag: null },
				],
				error: null,
			},
		});

		const results = await getPublishedConfigs(supabase as never);

		expect(results.map((entry) => entry.id)).toEqual(["cfg-2", "cfg-1"]);
		expect(results[0]).toMatchObject({
			id: "cfg-2",
			tools: [{ slug: "claude-code", name: "Claude Code" }],
			tags: [{ slug: "react", name: "React", category: "framework" }],
			total_votes: 0,
		});
		expect(results[1]).toMatchObject({
			id: "cfg-1",
			tools: [{ slug: "cursor", name: "Cursor" }],
			tags: [],
			total_votes: 0,
		});

		expect(calls.map((call) => call.table)).toEqual(["configs", "config_tools", "config_tags"]);
		expect(calls[0]?.eq).toEqual({ column: "status", value: "published" });
	});

	test("throws when base config query fails", async () => {
		const { supabase } = createSupabaseMock({
			configsResponse: { data: null, error: { message: "configs exploded" } },
			toolsResponse: { data: [], error: null },
			tagsResponse: { data: [], error: null },
		});

		await expect(getPublishedConfigs(supabase as never)).rejects.toThrow(
			"Failed to load published configs: configs exploded",
		);
	});

	test("throws when tools query fails", async () => {
		const { supabase } = createSupabaseMock({
			configsResponse: { data: [], error: null },
			toolsResponse: { data: null, error: { message: "tools exploded" } },
			tagsResponse: { data: [], error: null },
		});

		await expect(getPublishedConfigs(supabase as never)).rejects.toThrow(
			"Failed to load config tools: tools exploded",
		);
	});

	test("throws when tags query fails", async () => {
		const { supabase } = createSupabaseMock({
			configsResponse: { data: [], error: null },
			toolsResponse: { data: [], error: null },
			tagsResponse: { data: null, error: { message: "tags exploded" } },
		});

		await expect(getPublishedConfigs(supabase as never)).rejects.toThrow(
			"Failed to load config tags: tags exploded",
		);
	});
});
