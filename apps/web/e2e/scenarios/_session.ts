import type { Page } from "@playwright/test";
import { dismissCommonOverlays } from "../helpers/overlays";
import { e2eStep } from "./_log";
import { getOrigin } from "./_context";

/** BNHub demo login (real route, real session cookie). */
export async function bnhubLoginAs(page: Page, email: string, nextPath?: string): Promise<void> {
  const origin = getOrigin();
  const next = nextPath ?? "/bnhub/stays";
  e2eStep("bnhub_login_start", { email, next });
  await page.goto(`${origin}/bnhub/login?next=${encodeURIComponent(next)}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await dismissCommonOverlays(page);
  await page.waitForSelector('select[name="email"]', { state: "visible", timeout: 60_000 });
  await page.locator('select[name="email"]').selectOption(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.includes("/bnhub/login"), { timeout: 60_000 });
  e2eStep("bnhub_login_done", { email });
}

export async function lecipmLogin(page: Page, email: string, password: string): Promise<void> {
  const origin = getOrigin();
  e2eStep("lecipm_login_start", { email });
  await page.goto(`${origin}/auth/login`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await dismissCommonOverlays(page);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 60_000 }).catch(() => {});
  e2eStep("lecipm_login_done", { email });
}
