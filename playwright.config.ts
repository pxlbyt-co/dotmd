import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
	testDir: "./test/e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: false,
	timeout: 45_000,
	expect: {
		timeout: 10_000,
	},
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	workers: 1,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html"]],
	use: {
		baseURL: "http://127.0.0.1:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: "MOCK_SUPABASE_PORT=54321 bun test/e2e/mock-supabase.ts",
			port: 54321,
			reuseExistingServer: !isCI,
			timeout: 120_000,
		},
		{
			command:
				"NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-anon NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 REVALIDATION_SECRET=test-secret PORT=3000 bun run dev",
			port: 3000,
			reuseExistingServer: !isCI,
			timeout: 120_000,
		},
	],
});
