import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures";

/**
 * Visual baselines — commit snapshots next to this file (`*-snapshots/`).
 * Regenerate locally after intentional UI changes:
 *   `pnpm exec playwright test --project=visual --update-snapshots`
 */
test.describe("visual regression", () => {
  test("locale home", async ({ page }) => {
    await page.goto(localePath("/"));
    await expect(page).toHaveScreenshot("home.png", {
      fullPage: true,
      maxDiffPixels: 1200,
      animations: "disabled",
    });
  });

  test("lite sybnb hub", async ({ page }) => {
    await page.goto(localePath("/lite/sybnb"));
    await expect(page).toHaveScreenshot("lite-sybnb.png", {
      maxDiffPixels: 600,
      animations: "disabled",
    });
  });
});
