import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures";

/**
 * Locale-first smoke routes (`next-intl` `localePrefix: "always"`).
 * Prefer lite/stable URLs — full `/sybnb` browse can stress dev bundles.
 */
const ROUTES = [
  "/",
  "/lite/sybnb",
  "/lite/chat",
  "/lite/requests",
  "/sybnb/chat",
  "/sybnb/bookings",
];

for (const route of ROUTES) {
  test(`page loads ${route}`, async ({ page }) => {
    await page.goto(localePath(route));
    await expect(page.locator("body")).toBeVisible();
  });
}
