import { expect, test } from "@playwright/test";

test("browse list opens config detail page", async ({ page }) => {
	await page.goto("/browse", { waitUntil: "domcontentloaded" });

	await expect(page.getByRole("heading", { name: "Browse configs" })).toBeVisible();
	await expect(page.getByRole("link", { name: /Cursor React Starter/i })).toBeVisible();

	await page.getByRole("link", { name: /Cursor React Starter/i }).click({ noWaitAfter: true });

	await expect(page).toHaveURL(/\/cursor-react-starter$/);
	await expect(page.getByRole("heading", { name: "Cursor React Starter" })).toBeVisible();
	await expect(page.getByText("Community feedback")).toBeVisible();
	await expect(page.getByText("Configuration")).toBeVisible();
});
