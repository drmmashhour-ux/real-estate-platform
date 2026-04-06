import type { Page } from "@playwright/test";

type GotoWait = "load" | "domcontentloaded" | "networkidle" | "commit";

/**
 * Retry navigation when Next dev compiles or the browser aborts mid-navigation (net::ERR_ABORTED).
 */
export async function gotoWithRetry(
  page: Page,
  url: string,
  options: { waitUntil?: GotoWait; attempts?: number; perAttemptTimeout?: number } = {}
): Promise<void> {
  const waitUntil = options.waitUntil ?? "domcontentloaded";
  const attempts = options.attempts ?? 3;
  const perAttemptTimeout = options.perAttemptTimeout ?? 60_000;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url, { waitUntil, timeout: perAttemptTimeout });
      return;
    } catch (e) {
      lastError = e;
      await page.waitForTimeout(400 * (i + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
