import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures";

/** Cold dev compiles can exceed 3s — override with `PERF_MS_MAX`. */
const PERF_MS_MAX = Number(process.env.PERF_MS_MAX ?? "12000");

test.describe("navigation timing", () => {
  test("lite sybnb hub loads within budget", async ({ page }) => {
    const start = Date.now();
    await page.goto(localePath("/lite/sybnb"), { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const duration = Date.now() - start;
    expect(duration, `navigation took ${duration}ms (limit ${PERF_MS_MAX}ms)`).toBeLessThanOrEqual(PERF_MS_MAX);
  });
});
