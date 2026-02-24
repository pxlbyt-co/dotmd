import { expect, test } from "@playwright/test";

test("submit route renders auth gate or submission form", async ({ page }) => {
	await page.goto("/submit", { waitUntil: "domcontentloaded" });

	const submitHeading = page.getByRole("heading", { name: "Submit a config" });
	if (await submitHeading.isVisible()) {
		await page.getByLabel("Title").fill("Playwright E2E Config");
		await page
			.getByLabel("Description")
			.fill("A valid description used by the e2e suite to exercise submit flow.");
		await page
			.getByLabel("Content")
			.fill("# Playwright Config\n\nThis content is intentionally simple and valid.");

		await page.locator("#file-type").click();
		await page.locator("[role='listbox']").getByText("AGENTS.md", { exact: true }).click();

		await page.getByLabel("Cursor").check();
		await page.getByLabel("React").check();

		await page.getByRole("button", { name: "Submit config" }).click();

		await expect(
			page.getByText("Thanks! Your config has been submitted for review. Generated slug:"),
		).toBeVisible();
		return;
	}

	await expect(page.getByRole("heading", { name: "Sign in to submit" })).toBeVisible();
	await expect(page.getByRole("main").getByRole("button", { name: "Sign in" })).toBeVisible();
});
