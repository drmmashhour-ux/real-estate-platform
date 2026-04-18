import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsBroker } from "./utils/auth";
import { e2ePath } from "./utils/constants";

const adminPath = e2ePath("/admin");

test.describe("Admin route protection", () => {
  test("guest cannot access admin HTML (redirect away from admin app)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(adminPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/auth\/login|login|sign-in/i, { timeout: 20_000 });
    await ctx.close();
  });

  test("broker cannot stay on full admin surface", async ({ browser }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Password + seeded users required.");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAsBroker(page);
    await page.goto(adminPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/dashboard|broker|real-estate/i, { timeout: 20_000 });
    await ctx.close();
  });

  test("admin can open admin home", async ({ browser }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Password + admin_user@test.com required.");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginAsAdmin(page);
    await page.goto(adminPath);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/admin|control|LECIPM|dashboard/i).first()).toBeVisible({ timeout: 30_000 });
    await ctx.close();
  });
});
