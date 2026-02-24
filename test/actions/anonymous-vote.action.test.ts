import crypto from "node:crypto";

import { beforeEach, describe, expect, mock, test } from "bun:test";

type HeaderMap = Record<string, string | null | undefined>;

const CONFIG_ID = "11111111-1111-4111-8111-111111111111";

let currentHeaders: HeaderMap = {};
let currentSupabase: unknown;

const headersMock = mock(async () => ({
	get: (name: string) => currentHeaders[name] ?? null,
}));

const createClientMock = mock(async () => currentSupabase);

mock.module("next/headers", () => ({
	headers: (...args: unknown[]) => headersMock(...args),
}));

mock.module("@/lib/supabase/server", () => ({
	createClient: (...args: unknown[]) => createClientMock(...args),
}));

const { anonymousVote } = await import("../../src/actions/anonymous-vote");

function buildAnonymousVoteSupabase(existingId: string | null, count: number | null) {
	const maybeSingleMock = mock(async () => ({
		data: existingId ? { id: existingId } : null,
	}));
	const existsEqIpHashMock = mock((_column: string, _value: string) => ({
		maybeSingle: maybeSingleMock,
	}));
	const existsEqConfigMock = mock((_column: string, _value: string) => ({
		eq: existsEqIpHashMock,
	}));

	const countEqConfigMock = mock(async (_column: string, _value: string) => ({ count }));
	const selectMock = mock((columns: string, options?: { count?: string; head?: boolean }) => {
		if (options?.count === "exact") {
			return {
				eq: countEqConfigMock,
			};
		}

		if (columns === "id") {
			return {
				eq: existsEqConfigMock,
			};
		}

		throw new Error(`Unexpected select call: ${columns}`);
	});

	const insertMock = mock(async (_row: unknown) => ({ error: null }));
	const deleteEqMock = mock(async (_column: string, _value: string) => ({ error: null }));
	const deleteMock = mock(() => ({ eq: deleteEqMock }));

	const fromMock = mock((table: string) => {
		if (table !== "anonymous_votes") {
			throw new Error(`Unexpected table: ${table}`);
		}

		return {
			select: selectMock,
			insert: insertMock,
			delete: deleteMock,
		};
	});

	return {
		supabase: {
			from: fromMock,
		},
		mocks: {
			insertMock,
			deleteEqMock,
			existsEqIpHashMock,
		},
	};
}

describe("anonymousVote action", () => {
	beforeEach(() => {
		currentHeaders = {};
		currentSupabase = null;
		headersMock.mockReset();
		headersMock.mockImplementation(async () => ({
			get: (name: string) => currentHeaders[name] ?? null,
		}));
		createClientMock.mockClear();
	});

	test("adds vote using first forwarded IP hash", async () => {
		const { supabase, mocks } = buildAnonymousVoteSupabase(null, 2);
		currentSupabase = supabase;
		currentHeaders = {
			"x-forwarded-for": "10.0.0.1, 10.0.0.2",
		};

		const result = await anonymousVote({ config_id: CONFIG_ID });

		expect(result).toEqual({
			data: {
				voted: true,
				count: 2,
			},
		});
		expect(mocks.insertMock).toHaveBeenCalledTimes(1);

		const insertPayload = mocks.insertMock.mock.calls[0]?.[0] as {
			config_id: string;
			ip_hash: string;
		};

		expect(insertPayload.config_id).toBe(CONFIG_ID);
		expect(insertPayload.ip_hash).toBe(
			crypto.createHash("sha256").update("10.0.0.1").digest("hex"),
		);
		expect(mocks.deleteEqMock).not.toHaveBeenCalled();
	});

	test("removes vote when hashed IP already exists and defaults count to zero", async () => {
		const { supabase, mocks } = buildAnonymousVoteSupabase("anon-vote-id", null);
		currentSupabase = supabase;
		currentHeaders = {
			"x-real-ip": "192.168.1.20",
		};

		const result = await anonymousVote({ config_id: CONFIG_ID });

		expect(result).toEqual({
			data: {
				voted: false,
				count: 0,
			},
		});
		expect(mocks.deleteEqMock).toHaveBeenCalledWith("id", "anon-vote-id");
		expect(mocks.insertMock).not.toHaveBeenCalled();

		expect(mocks.existsEqIpHashMock).toHaveBeenCalledWith(
			"ip_hash",
			crypto.createHash("sha256").update("192.168.1.20").digest("hex"),
		);
	});
});
