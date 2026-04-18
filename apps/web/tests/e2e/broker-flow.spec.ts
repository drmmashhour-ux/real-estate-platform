import { expect, test } from "@playwright/test";
import { loginAsBroker } from "./utils/auth";
import { createConsoleTracker } from "./utils/console-tracker";
import { e2ePath } from "./utils/constants";

test.describe("Broker residential dashboard", () => {
  test.beforeEach(({ page }) => {
    const t = createConsoleTracker();
    (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole = t;
    t.attach(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const t = (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole;
    t?.assertClean(testInfo.title);
  });

  test("broker dashboard renders workspace (no crash)", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Set E2E_PRELAUNCH_PASSWORD + seed broker_user@test.com.");

    await loginAsBroker(page);
    await page.goto(e2ePath("/dashboard/broker"));
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/broker|lead|deal|pipeline|CRM|workspace/i).first()).toBeVisible({ timeout: 45_000 });
  });
});
