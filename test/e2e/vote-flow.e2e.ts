import { expect, test } from "@playwright/test";

test("detail page shows feedback controls", async ({ page }) => {
	await page.goto("/cursor-react-starter", { waitUntil: "domcontentloaded" });

	await expect(page.getByRole("heading", { name: "Cursor React Starter" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Community feedback" })).toBeVisible();

	const helpfulButton = page.getByRole("button", { name: /Mark helpful|Helpful/ });
	const voteButton = page.getByRole("button", { name: "Vote for Cursor" });

	await expect(helpfulButton).toBeVisible();
	await expect(voteButton).toBeVisible();

	await helpfulButton.click();
	await expect(helpfulButton).toContainText(/\(\d+\)/);
	await expect(voteButton).toContainText(/\d+/);
});
