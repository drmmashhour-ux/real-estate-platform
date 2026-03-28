import { expect, test } from "@playwright/test";

/**
 * Homepage-only launch smoke: hubs, header logo asset, zero console errors (filtered).
 */
test.describe("Homepage launch UI", () => {
  test("hubs, branding logo visible, no critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const t = msg.text();
      if (
        /favicon|ResizeObserver|Failed to load resource.*404|Failed to load resource.*401|net::ERR|cookie|Third-party cookie/i.test(
          t,
        )
      ) {
        return;
      }
      errors.push(t.slice(0, 400));
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(String(err?.message ?? err).slice(0, 400));
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("#hubs")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /four hubs/i })).toBeVisible();

    const logoImg = page.locator('header img[src*="/branding/"]').first();
    await expect(logoImg).toBeVisible({ timeout: 15_000 });

    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

    expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});
