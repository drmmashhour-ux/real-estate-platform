import { test, expect } from "@playwright/test";
import { E2E_LOCALE, localePath } from "../fixtures";

/**
 * Ultra-lite chat is read-only (offline message list); full composer lives on booking threads (`ChatBox`).
 * We verify shell + title and alias redirect from `/sybnb/chat` → `/lite/chat`.
 */
test.describe("Ultra-lite chat", () => {
  test("lite chat page loads", async ({ page }) => {
    await page.goto(localePath("/lite/chat"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("sybnb/chat alias redirects to lite chat", async ({ page }) => {
    await page.goto(localePath("/sybnb/chat"));
    await expect(page).toHaveURL(new RegExp(`/${E2E_LOCALE}/lite/chat`));
  });
});
