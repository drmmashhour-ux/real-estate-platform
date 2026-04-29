import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures";

/**
 * Full `/sybnb` browse depends on heavy client bundles; smoke-test the ultra-lite SY hub instead.
 * Use `/sybnb` manually or run Playwright against `pnpm start` after `pnpm build` if you need full browse.
 */
test.describe("Sybnb browse", () => {
  test("lite sybnb hub loads", async ({ page }) => {
    await page.goto(localePath("/lite/sybnb"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });
});
