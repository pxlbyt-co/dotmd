import { beforeEach, describe, expect, mock, test } from "bun:test";

const FILE_TYPE_ID = "11111111-1111-4111-8111-111111111111";
const TOOL_ID = "22222222-2222-4222-8222-222222222222";
const TAG_ID = "33333333-3333-4333-8333-333333333333";

const validPayload = {
	title: "My Great Config",
	description: "A solid config for real-world usage.",
	content: "# config\n\nThis is a tested sample config block.",
	file_type_id: FILE_TYPE_ID,
	tool_ids: [TOOL_ID],
	tag_ids: [TAG_ID],
};

let currentSupabase: unknown;

const createClientMock = mock(async () => currentSupabase);

mock.module("@/lib/supabase/server", () => ({
	createClient: (...args: unknown[]) => createClientMock(...args),
}));

const { submitConfig } = await import("../../src/actions/submit-config");

function buildSubmitSupabase(options?: {
	configInsertError?: string;
	toolsError?: string;
	tagsError?: string;
	insertedId?: string;
	userPreferredUsername?: string;
	userEmail?: string;
}) {
	const configInsertPayloads: unknown[] = [];
	const toolsInsertPayloads: unknown[] = [];
	const tagsInsertPayloads: unknown[] = [];

	const configSingleMock = mock(async () => {
		if (options?.configInsertError) {
			return {
				data: null,
				error: { message: options.configInsertError },
			};
		}

		return {
			data: { id: options?.insertedId ?? "cfg-new-id" },
			error: null,
		};
	});

	const configSelectMock = mock((_columns: string) => ({ single: configSingleMock }));
	const configInsertMock = mock((payload: unknown) => {
		configInsertPayloads.push(payload);
		return {
			select: configSelectMock,
		};
	});

	const toolsInsertMock = mock(async (payload: unknown) => {
		toolsInsertPayloads.push(payload);
		return {
			error: options?.toolsError ? { message: options.toolsError } : null,
		};
	});

	const tagsInsertMock = mock(async (payload: unknown) => {
		tagsInsertPayloads.push(payload);
		return {
			error: options?.tagsError ? { message: options.tagsError } : null,
		};
	});

	const fromMock = mock((table: string) => {
		if (table === "configs") {
			return {
				insert: configInsertMock,
			};
		}

		if (table === "config_tools") {
			return {
				insert: toolsInsertMock,
			};
		}

		if (table === "config_tags") {
			return {
				insert: tagsInsertMock,
			};
		}

		throw new Error(`Unexpected table: ${table}`);
	});

	return {
		supabase: {
			auth: {
				getUser: async () => ({
					data: {
						user: {
							id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
							email: options?.userEmail ?? "person@example.com",
							user_metadata:
								typeof options?.userPreferredUsername === "string"
									? { preferred_username: options.userPreferredUsername }
									: {},
						},
					},
					error: null,
				}),
			},
			from: fromMock,
		},
		mocks: {
			configInsertPayloads,
			toolsInsertPayloads,
			tagsInsertPayloads,
			configInsertMock,
			toolsInsertMock,
			tagsInsertMock,
		},
	};
}

describe("submitConfig action", () => {
	beforeEach(() => {
		createClientMock.mockClear();
		currentSupabase = null;
	});

	test("returns validation error for reserved slug titles", async () => {
		const { supabase, mocks } = buildSubmitSupabase();
		currentSupabase = supabase;

		const result = await submitConfig({
			...validPayload,
			title: "browse",
		});

		expect(result).toEqual({
			validationErrors: {
				title: {
					_errors: ["Title results in a reserved slug. Please choose a different title."],
				},
			},
		});
		expect(mocks.configInsertMock).not.toHaveBeenCalled();
		expect(mocks.toolsInsertMock).not.toHaveBeenCalled();
		expect(mocks.tagsInsertMock).not.toHaveBeenCalled();
	});

	test("creates config with username and inserts tool/tag relations", async () => {
		const { supabase, mocks } = buildSubmitSupabase({
			insertedId: "cfg-123",
			userPreferredUsername: "pxlbyt",
		});
		currentSupabase = supabase;

		const result = await submitConfig(validPayload);

		expect(result.data).toEqual({
			id: "cfg-123",
			slug: expect.stringMatching(/^my-great-config-[0-9a-f]{6}$/),
			status: "pending",
		});

		expect(mocks.configInsertPayloads[0]).toMatchObject({
			title: validPayload.title,
			description: validPayload.description,
			content: validPayload.content,
			file_type_id: FILE_TYPE_ID,
			license: "CC0",
			author_name: "pxlbyt",
			status: "pending",
			author_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
			slug: expect.stringMatching(/^my-great-config-[0-9a-f]{6}$/),
		});

		expect(mocks.toolsInsertPayloads[0]).toEqual([{ config_id: "cfg-123", tool_id: TOOL_ID }]);
		expect(mocks.tagsInsertPayloads[0]).toEqual([{ config_id: "cfg-123", tag_id: TAG_ID }]);
	});

	test("falls back to user email when preferred_username missing", async () => {
		const { supabase, mocks } = buildSubmitSupabase({
			userEmail: "fallback@example.com",
		});
		currentSupabase = supabase;

		await submitConfig(validPayload);

		expect(mocks.configInsertPayloads[0]).toMatchObject({
			author_name: "fallback@example.com",
		});
	});

	test("returns serverError when config insert fails", async () => {
		const { supabase } = buildSubmitSupabase({
			configInsertError: "insert failed",
		});
		currentSupabase = supabase;

		const result = await submitConfig(validPayload);

		expect(result).toEqual({ serverError: "Something went wrong" });
	});

	test("returns serverError when relation insert fails", async () => {
		const { supabase } = buildSubmitSupabase({
			tagsError: "tag join failed",
		});
		currentSupabase = supabase;

		const result = await submitConfig(validPayload);

		expect(result).toEqual({ serverError: "Something went wrong" });
	});
});
