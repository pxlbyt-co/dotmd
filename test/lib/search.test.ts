import { describe, expect, test } from "bun:test";

import { buildSearchUrl } from "../../src/lib/search";

describe("buildSearchUrl", () => {
	test("returns browse page when query is empty", () => {
		expect(buildSearchUrl("")).toBe("/browse");
		expect(buildSearchUrl("   ")).toBe("/browse");
	});

	test("trims and encodes query", () => {
		expect(buildSearchUrl("  next js  ")).toBe("/browse?q=next%20js");
		expect(buildSearchUrl("AGENTS.md + SOUL.md")).toBe(
			"/browse?q=AGENTS.md%20%2B%20SOUL.md",
		);
	});
});
