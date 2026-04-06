/**
 * LECIPM Manager — full launch validation (10 scenarios, growth metrics, report).
 * Same as `e2e/scenarios/run-all.spec.ts`; entry at e2e root for discoverability.
 */
import { expect, test } from "@playwright/test";
import { runAllScenarios } from "./runner";

test.describe.configure({ timeout: 600_000 });

test("run all launch scenarios (serial simulation)", async ({ page }) => {
  const results = await runAllScenarios(page);
  const fails = results.filter((r) => r.status === "FAIL");
  expect(
    fails,
    fails.map((f) => `${f.id} ${f.name}: ${f.detail}`).join(" | "),
  ).toEqual([]);
});
