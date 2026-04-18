import { expect, test } from "@playwright/test";
import { loginAsHost } from "./utils/auth";
import { createConsoleTracker } from "./utils/console-tracker";
import { e2ePath } from "./utils/constants";

test.describe("Host dashboard", () => {
  test.beforeEach(({ page }) => {
    const t = createConsoleTracker();
    (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole = t;
    t.attach(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const t = (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole;
    t?.assertClean(testInfo.title);
  });

  test("host dashboard loads listings / hub surface", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Set E2E_PRELAUNCH_PASSWORD + seed host_user@test.com.");

    await loginAsHost(page);
    await page.goto(e2ePath("/dashboard/bnhub"));
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/listing|booking|host|dashboard|BNHUB|revenue|earn/i).first()
    ).toBeVisible({ timeout: 45_000 });
  });
});
