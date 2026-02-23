import { describe, expect, test } from "bun:test";

import { cn } from "../../src/lib/utils";

describe("cn", () => {
	test("merges conflicting tailwind classes", () => {
		expect(cn("p-2", "p-4", "text-sm")).toBe("p-4 text-sm");
	});

	test("drops falsy values", () => {
		expect(cn("font-semibold", false && "hidden", undefined, null, "tracking-tight")).toBe(
			"font-semibold tracking-tight",
		);
	});
});
