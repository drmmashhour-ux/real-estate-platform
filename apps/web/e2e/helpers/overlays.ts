import type { Locator, Page } from "@playwright/test";

/** Dismiss global modals/banners that block clicks (cookie, welcome, onboarding, feedback, growth popup). */
export async function dismissCommonOverlays(page: Page): Promise<void> {
  const tryClick = async (get: () => Locator, visMs = 2000) => {
    const el = get().first();
    if (await el.isVisible({ timeout: visMs }).catch(() => false)) {
      await el.click({ timeout: 5000, force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  };

  const safeClickTestId = async (testId: string) => {
    const el = page.locator(`[data-testid="${testId}"]`).first();
    if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
      await el.click({ timeout: 4000, force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  };

  await safeClickTestId("accept-cookies");

  const cookieByRole = page.getByRole("dialog", { name: /cookie consent/i });
  if (await cookieByRole.isVisible({ timeout: 1200 }).catch(() => false)) {
    await cookieByRole.getByRole("button", { name: /^accept$/i }).click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);
  }

  await tryClick(() => page.locator('[aria-label="Cookie consent"]').getByRole("button", { name: /^accept$/i }));

  for (let round = 0; round < 3; round++) {
    await tryClick(() => page.getByRole("button", { name: /^skip$/i }));
    await tryClick(() => page.getByRole("button", { name: /^continue$/i }), 2500);
    await tryClick(() => page.getByRole("button", { name: /^got it$/i }));
    await tryClick(() => page.getByRole("button", { name: /^close$/i }));
    await tryClick(() => page.getByRole("button", { name: /^cancel$/i }));
    await tryClick(() => page.getByRole("button", { name: /^maybe later$/i }));

    const welcome = page.locator('[aria-labelledby="onboard-title"]');
    if (await welcome.isVisible({ timeout: 600 }).catch(() => false)) {
      await welcome.getByRole("button", { name: /^skip$/i }).click({ timeout: 5000, force: true }).catch(() => {});
      await welcome.getByRole("button", { name: /^continue$/i }).click({ timeout: 3000, force: true }).catch(() => {});
    }

    const investWelcome = page.locator('[aria-labelledby="invest-welcome-title"]');
    if (await investWelcome.isVisible({ timeout: 600 }).catch(() => false)) {
      await investWelcome.getByRole("button", { name: /^skip$/i }).click({ timeout: 5000, force: true }).catch(() => {});
    }

    const feedbackDlg = page.locator('[aria-labelledby="feedback-modal-title"]');
    if (await feedbackDlg.isVisible({ timeout: 600 }).catch(() => false)) {
      await feedbackDlg.getByRole("button", { name: /^close$/i }).click({ timeout: 4000, force: true }).catch(() => {});
    }

    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(150);
  }
}
