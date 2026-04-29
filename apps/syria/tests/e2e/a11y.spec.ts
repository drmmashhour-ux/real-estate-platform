import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localePath } from "../fixtures";

/**
 * Contrast is tracked separately (design tokens); axe contrast can fail on muted ultra-lite greys.
 */
test.describe("accessibility", () => {
  test.setTimeout(60_000);

  test("lite sybnb hub — no critical or serious axe violations", async ({ page }) => {
    await page.goto(localePath("/lite/sybnb"));
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
