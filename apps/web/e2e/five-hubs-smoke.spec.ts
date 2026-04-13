/**
 * Browser smoke for the five hub surfaces that align with
 * `pnpm validate:five-hub-transactions` (DB integration script).
 *
 * - TX1 BNHub — short stays
 * - TX2 Buy — search / listings
 * - TX3 Financial — mortgage + financial hub
 * - TX4 Seller — sell journey
 * - TX5 Broker — public broker CRM entry
 *
 * Prereq: app reachable at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3001).
 * Run: pnpm --filter @lecipm/web run test:e2e:five-hubs
 */
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { dismissCommonOverlays } from "./helpers/overlays";
import { gotoWithRetry } from "./helpers/navigation";

test.describe.configure({ timeout: 120_000, mode: "serial" });
test.use({ viewport: { width: 1400, height: 900 } });

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(35_000);
  page.setDefaultNavigationTimeout(60_000);
});

async function assertPublicPageLoads(page: Page, path: string, label: string): Promise<void> {
  await gotoWithRetry(page, path, { waitUntil: "domcontentloaded" });
  await dismissCommonOverlays(page);
  const notFound = await page.getByText("This page could not be found").isVisible().catch(() => false);
  expect(notFound, `${label} (${path}) should not 404`).toBeFalsy();
  const body = await page.locator("body").innerText();
  expect(body.length, `${label} has meaningful content`).toBeGreaterThan(80);
}

test.describe("Five hubs — entry pages (matches validate:five-hub-transactions)", () => {
  test("TX1 BNHub — /bnhub loads", async ({ page }) => {
    await assertPublicPageLoads(page, "/bnhub", "BNHub");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("TX2 Buy — /buy and /listings load", async ({ page }) => {
    await assertPublicPageLoads(page, "/buy", "Buy hub");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });

    await assertPublicPageLoads(page, "/listings", "Listings");
    await expect(page.getByPlaceholder(/search by city/i)).toBeVisible({ timeout: 20_000 });
  });

  test("TX3 Financial — /mortgage and /financial-hub load", async ({ page }) => {
    await assertPublicPageLoads(page, "/mortgage", "Mortgage");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });

    await assertPublicPageLoads(page, "/financial-hub", "Financial hub");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("TX4 Seller — /sell loads", async ({ page }) => {
    await assertPublicPageLoads(page, "/sell", "Seller hub");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("TX5 Broker — public /broker loads", async ({ page }) => {
    await assertPublicPageLoads(page, "/broker", "Broker hub");
    await expect(page.getByText(/broker crm/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /licensed professional tools/i })).toBeVisible();
  });
});
