import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

type CookieToSet = {
	name: string;
	value: string;
	options?: Record<string, unknown>;
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "placeholder_anon_key";

let createServerClientImpl: (
	url: string,
	key: string,
	options: {
		cookies: {
			getAll: () => { name: string; value: string }[];
			setAll: (cookiesToSet: CookieToSet[]) => void;
		};
	},
) => { auth: { getUser: () => Promise<unknown> } };

const createServerClientMock = mock(
	(...args: Parameters<NonNullable<typeof createServerClientImpl>>) =>
		createServerClientImpl(...args),
);

mock.module("@supabase/ssr", () => ({
	createServerClient: (...args: Parameters<NonNullable<typeof createServerClientImpl>>) =>
		createServerClientMock(...args),
}));

const { updateSession } = await import("../../src/lib/supabase/middleware");

describe("updateSession", () => {
	beforeEach(() => {
		createServerClientMock.mockClear();
		createServerClientImpl = (_url, _key) => ({
			auth: {
				getUser: async () => ({ data: { user: null }, error: null }),
			},
		});
	});

	test("creates supabase middleware client and calls auth.getUser", async () => {
		const getUserMock = mock(async () => ({ data: { user: null }, error: null }));
		createServerClientImpl = (_url, _key) => ({
			auth: {
				getUser: getUserMock,
			},
		});

		const request = new NextRequest("https://dotmd.directory/browse");
		const response = await updateSession(request);

		expect(response.status).toBe(200);
		expect(getUserMock).toHaveBeenCalledTimes(1);

		expect(createServerClientMock).toHaveBeenCalledWith(
			"https://placeholder.supabase.co",
			"placeholder_anon_key",
			expect.objectContaining({
				cookies: expect.objectContaining({
					getAll: expect.any(Function),
					setAll: expect.any(Function),
				}),
			}),
		);
	});

	test("propagates cookies to both request and response when setAll runs", async () => {
		createServerClientImpl = (_url, _key, options) => ({
			auth: {
				getUser: async () => {
					options.cookies.setAll([
						{
							name: "sb-access-token",
							value: "token-123",
							options: { path: "/", httpOnly: true },
						},
					]);
					return { data: { user: null }, error: null };
				},
			},
		});

		const request = new NextRequest("https://dotmd.directory/browse");
		const response = await updateSession(request);

		expect(request.cookies.get("sb-access-token")?.value).toBe("token-123");
		expect(response.cookies.get("sb-access-token")?.value).toBe("token-123");
	});
});
