import { beforeEach, describe, expect, mock, test } from "bun:test";

const createClientMock = mock(async () => {
	throw new Error("createClient mock not configured");
});

mock.module("@/lib/supabase/server", () => ({
	createClient: (...args: unknown[]) => createClientMock(...args),
}));

const { GET } = await import("../../src/app/api/health/route");

describe("GET /api/health", () => {
	beforeEach(() => {
		createClientMock.mockReset();
	});

	test("returns ok when db query succeeds", async () => {
		const limitMock = mock(async () => ({ error: null }));
		const selectMock = mock(() => ({ limit: limitMock }));
		const fromMock = mock(() => ({ select: selectMock }));

		createClientMock.mockResolvedValue({ from: fromMock });

		const response = await GET();
		const body = (await response.json()) as { status: string; db: string; timestamp: string };

		expect(response.status).toBe(200);
		expect(body.status).toBe("ok");
		expect(body.db).toBe("connected");
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);

		expect(fromMock).toHaveBeenCalledWith("file_types");
		expect(selectMock).toHaveBeenCalledWith("id");
		expect(limitMock).toHaveBeenCalledWith(1);
	});

	test("returns degraded when db query returns error", async () => {
		const limitMock = mock(async () => ({ error: { message: "db unavailable" } }));
		const selectMock = mock(() => ({ limit: limitMock }));
		const fromMock = mock(() => ({ select: selectMock }));

		createClientMock.mockResolvedValue({ from: fromMock });

		const response = await GET();
		const body = (await response.json()) as { status: string; db: string; timestamp: string };

		expect(response.status).toBe(200);
		expect(body.status).toBe("degraded");
		expect(body.db).toBe("error");
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
	});

	test("returns degraded when createClient throws", async () => {
		createClientMock.mockRejectedValue(new Error("kaboom"));

		const response = await GET();
		const body = (await response.json()) as { status: string; db: string; timestamp: string };

		expect(response.status).toBe(200);
		expect(body.status).toBe("degraded");
		expect(body.db).toBe("error");
		expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
	});
});
