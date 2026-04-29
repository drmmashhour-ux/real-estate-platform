import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures";

/**
 * Offline resilience: load shell online first (Chromium cannot navigate while offline),
 * then toggle offline — persisted DOM should remain for ultra-lite pages.
 */
test.describe("Offline shell", () => {
  test("lite chat heading survives offline toggle", async ({ page, context }) => {
    await page.goto(localePath("/lite/chat"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.setOffline(false);
  });
});
