import type { Page } from "@playwright/test";
import { e2ePath } from "./constants";

/**
 * Prelaunch seed users — see `scripts/seed-prelaunch-test-users.ts`.
 * Set `E2E_PRELAUNCH_PASSWORD` (same as `PRELAUNCH_TEST_PASSWORD`) in `.env` for CI/local.
 */
function requirePrelaunchPassword(): string {
  const p = process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim();
  if (!p || p.length < 8) {
    throw new Error(
      "Set E2E_PRELAUNCH_PASSWORD or PRELAUNCH_TEST_PASSWORD (min 8 chars) — run: PRELAUNCH_TEST_PASSWORD='…' npx tsx scripts/seed-prelaunch-test-users.ts"
    );
  }
  return p;
}

async function loginWithEmailPassword(page: Page, email: string, password: string): Promise<void> {
  await page.goto(e2ePath("/auth/login"));
  await page.locator('[data-testid="lecipm-auth-login-form"]').waitFor({ state: "visible", timeout: 30_000 });
  await page.locator('[data-testid="lecipm-auth-login-form"] input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 45_000 });
}

/** Signed-in marketplace user (BNHub guest / buyer). */
export async function loginAsGuest(page: Page): Promise<void> {
  const email = process.env.E2E_USER_GUEST_EMAIL?.trim() || "buyer_user@test.com";
  await loginWithEmailPassword(page, email, requirePrelaunchPassword());
}

/** BNHub host role. */
export async function loginAsHost(page: Page): Promise<void> {
  const email = process.env.E2E_USER_HOST_EMAIL?.trim() || "host_user@test.com";
  await loginWithEmailPassword(page, email, requirePrelaunchPassword());
}

/** Residential broker CRM. */
export async function loginAsBroker(page: Page): Promise<void> {
  const email = process.env.E2E_USER_BROKER_EMAIL?.trim() || "broker_user@test.com";
  await loginWithEmailPassword(page, email, requirePrelaunchPassword());
}

/** Platform admin (full admin surface). */
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_USER_ADMIN_EMAIL?.trim() || "admin_user@test.com";
  await loginWithEmailPassword(page, email, requirePrelaunchPassword());
}
