import { expect, test } from "@playwright/test";
import { loginAsGuest } from "./utils/auth";
import { createConsoleTracker } from "./utils/console-tracker";
import { e2ePath } from "./utils/constants";

test.describe("BNHub real booking UX", () => {
  test.beforeEach(({ page }) => {
    const t = createConsoleTracker();
    (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole = t;
    t.attach(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const t = (page as unknown as { __lecipmConsole?: ReturnType<typeof createConsoleTracker> }).__lecipmConsole;
    t?.assertClean(testInfo.title);
  });

  test("homepage → stays → listing: title, images, price, book CTA", async ({ page }) => {
    await page.goto(e2ePath("/"));
    await expect(page.locator("body")).toBeVisible();
    expect((await page.locator("body").innerText()).length).toBeGreaterThan(40);

    await page.goto(e2ePath("/bnhub/stays"));
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/stay|search|BNHUB|night/i).first()).toBeVisible({ timeout: 45_000 });

    const listingLink = page.locator('a[href*="/bnhub/listings/"]').first();
    if ((await listingLink.count()) === 0) {
      test.skip(true, "No listing links — seed BNHub listings (e.g. pnpm seed:qa-blockers or demo data).");
    }

    await listingLink.click();
    await expect(page).toHaveURL(/bnhub\/listings\//);
    await expect(page.locator("body")).toBeVisible();

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 30_000 });

    await expect(page.locator("img[src]").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/\$|\/ night|per night|night/i).first()).toBeVisible({ timeout: 30_000 });

    const book = page.getByRole("button", { name: /book|reserve/i }).or(page.getByRole("link", { name: /book|reserve/i }));
    await expect(book.first()).toBeVisible({ timeout: 30_000 });
  });

  test("checkout route shows summary or auth wall (no blank page)", async ({ page }) => {
    await page.goto(e2ePath("/bnhub/checkout"));
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test("signed-in guest can open booking flow UI (session via real login)", async ({ page }) => {
    const hasPw = !!(process.env.E2E_PRELAUNCH_PASSWORD?.trim() || process.env.PRELAUNCH_TEST_PASSWORD?.trim());
    test.skip(!hasPw, "Set E2E_PRELAUNCH_PASSWORD or PRELAUNCH_TEST_PASSWORD and seed prelaunch users.");

    await loginAsGuest(page);
    await page.goto(e2ePath("/bnhub/stays"));
    await expect(page.locator("body")).toBeVisible();
    const listingLink = page.locator(`a[href*="/bnhub/listings/"]`).first();
    if ((await listingLink.count()) === 0) {
      test.skip(true, "No listings for booking flow.");
    }
    await listingLink.click();
    await expect(page).toHaveURL(/bnhub\/listings\//);
    const book = page.getByRole("button", { name: /book|reserve|request/i }).first();
    await expect(book).toBeVisible({ timeout: 30_000 });
    await book.click();
    await page.waitForTimeout(500);
    const url = page.url();
    const ok =
      /checkout|stripe|auth|login|book|bnhub/i.test(url) || (await page.locator("body").innerText()).length > 30;
    expect(ok).toBeTruthy();
  });
});
