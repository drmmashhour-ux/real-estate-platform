import { test, expect } from "@playwright/test";
import { E2E_LOCALE, localePath } from "../fixtures";

test.describe("Home / locale entry", () => {
  test("default locale home renders", async ({ page }) => {
    await page.goto(localePath("/"));
    await expect(page).toHaveURL(new RegExp(`/${E2E_LOCALE}/?$`));
    await expect(page.locator("body")).toBeVisible();
  });

  test("root redirects into a locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(ar|en)\/?$/);
  });
});
