import { describe, expect, mock, test } from "bun:test";
import { NextRequest, NextResponse } from "next/server";

const updateSessionMock = mock(async (_request: NextRequest) =>
	NextResponse.json({ ok: true }, { status: 203 }),
);

mock.module("@/lib/supabase/middleware", () => ({
	updateSession: (...args: [NextRequest]) => updateSessionMock(...args),
}));

const { config, middleware } = await import("../../src/middleware");

describe("root middleware", () => {
	test("delegates to updateSession", async () => {
		const request = new NextRequest("https://dotmd.directory/browse");
		const response = await middleware(request);

		expect(updateSessionMock).toHaveBeenCalledWith(request);
		expect(response.status).toBe(203);
		expect(await response.json()).toEqual({ ok: true });
	});

	test("keeps static asset matcher exclusions", () => {
		expect(config.matcher).toEqual([
			"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
		]);
	});
});
