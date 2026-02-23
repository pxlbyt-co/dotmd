import { beforeEach, describe, expect, mock, test } from "bun:test";

const createClientMock = mock(async () => {
	throw new Error("createClient mock not configured");
});

mock.module("@/lib/supabase/server", () => ({
	createClient: (...args: unknown[]) => createClientMock(...args),
}));

const { GET } = await import("../../src/app/api/search/route");

function createSearchSupabaseResponse(rangeResult: { data: unknown[] | null; error: unknown | null }) {
	const rangeMock = mock(async () => rangeResult);
	const textSearchMock = mock(() => ({ range: rangeMock }));
	const eqMock = mock(() => ({ textSearch: textSearchMock }));
	const selectMock = mock(() => ({ eq: eqMock }));
	const fromMock = mock(() => ({ select: selectMock }));

	return {
		supabase: {
			from: fromMock,
		},
		mocks: {
			fromMock,
			selectMock,
			eqMock,
			textSearchMock,
			rangeMock,
		},
	};
}

describe("GET /api/search", () => {
	beforeEach(() => {
		createClientMock.mockReset();
	});

	test("returns 400 when query is missing or blank", async () => {
		const missing = await GET(new Request("https://dotmd.directory/api/search"));
		const missingBody = (await missing.json()) as { error: string };

		expect(missing.status).toBe(400);
		expect(missingBody).toEqual({ error: "query required" });
		expect(createClientMock).not.toHaveBeenCalled();

		const blank = await GET(new Request("https://dotmd.directory/api/search?q=%20%20%20"));
		const blankBody = (await blank.json()) as { error: string };

		expect(blank.status).toBe(400);
		expect(blankBody).toEqual({ error: "query required" });
		expect(createClientMock).not.toHaveBeenCalled();
	});

	test("searches published configs and maps nested relations", async () => {
		const { supabase, mocks } = createSearchSupabaseResponse({
			data: [
				{
					id: "cfg-1",
					slug: "awesome-config",
					title: "Awesome Config",
					description: "Does the thing",
					author_name: "arlo",
					tools: [
						{ tool: { slug: "cursor", name: "Cursor" } },
						{ tool: null },
					],
					tags: [
						{ tag: { slug: "react", name: "React" } },
						{ tag: null },
					],
				},
			],
			error: null,
		});

		createClientMock.mockResolvedValue(supabase);

		const response = await GET(
			new Request("https://dotmd.directory/api/search?q=%20next%20js%20&limit=999&offset=2"),
		);
		const body = (await response.json()) as {
			results: Array<{
				id: string;
				tools: Array<{ slug: string; name: string }>;
				tags: Array<{ slug: string; name: string }>;
				total_votes: number;
			}>;
			total: number;
			query: string;
		};

		expect(response.status).toBe(200);
		expect(body.query).toBe("next js");
		expect(body.total).toBe(1);
		expect(body.results[0]).toEqual({
			id: "cfg-1",
			slug: "awesome-config",
			title: "Awesome Config",
			description: "Does the thing",
			author_name: "arlo",
			tools: [{ slug: "cursor", name: "Cursor" }],
			tags: [{ slug: "react", name: "React" }],
			total_votes: 0,
		});

		expect(mocks.fromMock).toHaveBeenCalledWith("configs");
		expect(mocks.eqMock).toHaveBeenCalledWith("status", "published");
		expect(mocks.textSearchMock).toHaveBeenCalledWith("search_vector", "next js", {
			type: "websearch",
			config: "english",
		});
		expect(mocks.rangeMock).toHaveBeenCalledWith(2, 51);
	});

	test("falls back to default pagination for invalid values", async () => {
		const { supabase, mocks } = createSearchSupabaseResponse({
			data: [],
			error: null,
		});
		createClientMock.mockResolvedValue(supabase);

		const response = await GET(
			new Request("https://dotmd.directory/api/search?q=config&limit=-8&offset=wat"),
		);

		expect(response.status).toBe(200);
		expect(mocks.rangeMock).toHaveBeenCalledWith(0, 19);
	});

	test("returns 503 when supabase search errors", async () => {
		const { supabase } = createSearchSupabaseResponse({
			data: null,
			error: { message: "search failed" },
		});
		createClientMock.mockResolvedValue(supabase);

		const response = await GET(new Request("https://dotmd.directory/api/search?q=cursor"));
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(503);
		expect(body).toEqual({ error: "search unavailable" });
	});

	test("returns 503 when createClient throws", async () => {
		createClientMock.mockRejectedValue(new Error("boom"));

		const response = await GET(new Request("https://dotmd.directory/api/search?q=cursor"));
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(503);
		expect(body).toEqual({ error: "search unavailable" });
	});
});
