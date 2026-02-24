import { beforeEach, describe, expect, mock, test } from "bun:test";

const insertMock = mock(async () => ({ error: null as null | { code?: string } }));
const fromMock = mock((_table: string) => ({
	insert: insertMock,
}));

mock.module("@/lib/supabase/server", () => ({
	createClient: async () => ({
		from: fromMock,
	}),
}));

const { subscribeAction } = await import("../../src/actions/subscribe");

describe("subscribeAction", () => {
	beforeEach(() => {
		insertMock.mockReset();
		fromMock.mockReset();
		fromMock.mockImplementation((_table: string) => ({
			insert: insertMock,
		}));
	});

	test("normalizes email and returns success", async () => {
		insertMock.mockResolvedValue({ error: null });

		const result = await subscribeAction({ email: "USER@Example.COM" });

		expect(result).toEqual({ data: { success: true } });
		expect(fromMock).toHaveBeenCalledWith("email_subscribers");
		expect(insertMock).toHaveBeenCalledWith({ email: "user@example.com" });
	});

	test("treats duplicate subscriber as success", async () => {
		insertMock.mockResolvedValue({ error: { code: "23505" } });

		const result = await subscribeAction({ email: "user@example.com" });

		expect(result).toEqual({ data: { success: true } });
	});

	test("returns serverError on unexpected insert failures", async () => {
		insertMock.mockResolvedValue({ error: { code: "XX000" } });

		const result = await subscribeAction({ email: "user@example.com" });

		expect(result).toEqual({ serverError: "Something went wrong" });
	});

	test("returns validation error for invalid email", async () => {
		const result = await subscribeAction({ email: "not-an-email" });

		expect(result).toEqual({
			validationErrors: {
				email: {
					_errors: ["Please enter a valid email address"],
				},
			},
		});
		expect(insertMock).not.toHaveBeenCalled();
	});
});
