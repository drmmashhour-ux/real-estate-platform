import { test, expect } from "@playwright/test";
import { E2E_LOCALE, localePath } from "../fixtures";

test.describe("Bookings / requests", () => {
  test("lite requests (bookings list) loads", async ({ page }) => {
    await page.goto(localePath("/lite/requests"));
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("sybnb/bookings alias redirects to lite requests", async ({ page }) => {
    await page.goto(localePath("/sybnb/bookings"));
    await expect(page).toHaveURL(new RegExp(`/${E2E_LOCALE}/lite/requests`));
  });
});
