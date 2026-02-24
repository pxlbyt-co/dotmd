import { beforeEach, describe, expect, mock, test } from "bun:test";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CONFIG_ID = "11111111-1111-4111-8111-111111111111";
const TOOL_ID = "22222222-2222-4222-8222-222222222222";

let currentSupabase: unknown;

const createClientMock = mock(async () => currentSupabase);

mock.module("@/lib/supabase/server", () => ({
	createClient: (...args: unknown[]) => createClientMock(...args),
}));

const { vote } = await import("../../src/actions/vote");

function buildVoteSupabase(existingVoteId: string | null, count: number) {
	const maybeSingleMock = mock(async () => ({
		data: existingVoteId ? { id: existingVoteId } : null,
	}));
	const existingEqToolMock = mock((_column: string, _value: string) => ({
		maybeSingle: maybeSingleMock,
	}));
	const existingEqConfigMock = mock((_column: string, _value: string) => ({
		eq: existingEqToolMock,
	}));
	const existingEqUserMock = mock((_column: string, _value: string) => ({
		eq: existingEqConfigMock,
	}));

	const countEqToolMock = mock(async (_column: string, _value: string) => ({ count }));
	const countEqConfigMock = mock((_column: string, _value: string) => ({
		eq: countEqToolMock,
	}));

	const selectMock = mock((columns: string, options?: { count?: string; head?: boolean }) => {
		if (options?.count === "exact") {
			return {
				eq: countEqConfigMock,
			};
		}

		if (columns === "id") {
			return {
				eq: existingEqUserMock,
			};
		}

		throw new Error(`Unexpected select call: ${columns}`);
	});

	const deleteEqMock = mock(async (_column: string, _value: string) => ({ error: null }));
	const deleteMock = mock(() => ({ eq: deleteEqMock }));
	const insertMock = mock(async (_row: unknown) => ({ error: null }));

	const fromMock = mock((table: string) => {
		if (table !== "votes") {
			throw new Error(`Unexpected table: ${table}`);
		}

		return {
			select: selectMock,
			delete: deleteMock,
			insert: insertMock,
		};
	});

	return {
		supabase: {
			auth: {
				getUser: async () => ({
					data: {
						user: {
							id: USER_ID,
							email: "user@example.com",
							user_metadata: {},
						},
					},
					error: null,
				}),
			},
			from: fromMock,
		},
		mocks: {
			insertMock,
			deleteEqMock,
			countEqConfigMock,
			countEqToolMock,
		},
	};
}

describe("vote action", () => {
	beforeEach(() => {
		createClientMock.mockClear();
		currentSupabase = null;
	});

	test("adds vote when user has not voted for tool", async () => {
		const { supabase, mocks } = buildVoteSupabase(null, 7);
		currentSupabase = supabase;

		const result = await vote({ config_id: CONFIG_ID, tool_id: TOOL_ID });

		expect(result).toEqual({
			data: {
				voted: true,
				newCount: 7,
			},
		});
		expect(mocks.insertMock).toHaveBeenCalledWith({
			user_id: USER_ID,
			config_id: CONFIG_ID,
			tool_id: TOOL_ID,
		});
		expect(mocks.deleteEqMock).not.toHaveBeenCalled();
	});

	test("removes vote when user already voted for tool", async () => {
		const { supabase, mocks } = buildVoteSupabase("vote-row-id", 3);
		currentSupabase = supabase;

		const result = await vote({ config_id: CONFIG_ID, tool_id: TOOL_ID });

		expect(result).toEqual({
			data: {
				voted: false,
				newCount: 3,
			},
		});
		expect(mocks.deleteEqMock).toHaveBeenCalledWith("id", "vote-row-id");
		expect(mocks.insertMock).not.toHaveBeenCalled();
	});
});
