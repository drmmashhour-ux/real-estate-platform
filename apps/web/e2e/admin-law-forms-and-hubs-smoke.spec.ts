/**
 * Admin law helper + form filler surfaces, plus light public hub smoke.
 * Prereq: seeded DB + dev server. Admin: pnpm seed:qa-blockers (admin@demo.com / AdminDemo2024!).
 *
 * Full money movement: see lecipm-functional-qa (booking + checkout session) and
 * scripts validating Stripe webhook (no PAN in browser tests).
 */
import { expect, test } from "@playwright/test";
import { dismissCommonOverlays } from "./helpers/overlays";
import { gotoWithRetry } from "./helpers/navigation";

test.describe.configure({ timeout: 120_000, mode: "serial" });

test.use({ viewport: { width: 1400, height: 900 } });

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(35_000);
  page.setDefaultNavigationTimeout(60_000);
});

test("public hubs: marketing entry pages load", async ({ page }) => {
  const paths = ["/listings", "/sell", "/bnhub", "/mortgage", "/help", "/analyze"];
  for (const p of paths) {
    await gotoWithRetry(page, p, { waitUntil: "domcontentloaded" });
    await dismissCommonOverlays(page);
    const notFound = await page.getByText("This page could not be found").isVisible().catch(() => false);
    expect(notFound, `${p} should render`).toBeFalsy();
    const body = await page.locator("body").innerText();
    expect(body.length, `${p} has content`).toBeGreaterThan(80);
  }
});

test("admin: law helper, form filler, contract builder reachable", async ({ page, context }) => {
  const em = process.env.E2E_ADMIN_EMAIL?.trim() || "admin@demo.com";
  const pw = process.env.E2E_ADMIN_PASSWORD?.trim() || "AdminDemo2024!";
  await context.clearCookies();
  await gotoWithRetry(page, "/auth/login", { waitUntil: "domcontentloaded" });
  await dismissCommonOverlays(page);
  const form = page.getByTestId("lecipm-auth-login-form");
  await form.locator('input[name="email"]').fill(em);
  await form.locator('input[name="password"]').fill(pw);
  await form.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 60_000 });

  await gotoWithRetry(page, "/admin/dashboard", { waitUntil: "domcontentloaded" });
  expect(page.url()).not.toContain("/auth/login");
  await dismissCommonOverlays(page);
  await expect(page.getByTestId("admin-dashboard-law-forms-strip")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /law helper \(ai monitor/i })).toBeVisible();

  await gotoWithRetry(page, "/admin/legal-ai", { waitUntil: "domcontentloaded" });
  expect(page.url()).not.toContain("/auth/login");
  await dismissCommonOverlays(page);
  await expect(page.getByTestId("admin-law-helper-eyebrow")).toHaveText(/law helper/i);
  await expect(page.getByTestId("admin-law-helper-title")).toBeVisible();

  await gotoWithRetry(page, "/admin/forms", {
    waitUntil: "networkidle",
    attempts: 4,
    perAttemptTimeout: 90_000,
  });
  expect(page.url()).not.toContain("/auth/login");
  await dismissCommonOverlays(page);
  await expect(page.getByTestId("admin-forms-filler-page")).toBeVisible();
  await expect(page.getByTestId("admin-forms-filler-title")).toBeVisible();

  await gotoWithRetry(page, "/admin/contracts-builder", { waitUntil: "domcontentloaded" });
  expect(page.url()).not.toContain("/auth/login");
  await dismissCommonOverlays(page);
  await expect(page.getByTestId("admin-contract-template-builder")).toBeVisible();
  await expect(page.getByTestId("admin-contract-builder-title")).toBeVisible();
});
