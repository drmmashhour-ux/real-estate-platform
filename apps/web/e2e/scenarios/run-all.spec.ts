/**
 * Full launch E2E simulation: real APIs, real DB, optional Stripe test keys.
 *
 * Run: `pnpm exec playwright test e2e/scenarios/run-all.spec.ts`
 * Env: DATABASE_URL, PLAYWRIGHT_BASE_URL, STRIPE_* (scenario 1), E2E_ADMIN_* (2,7,10), seeded BNHub users.
 */
import { expect, test } from "@playwright/test";
import { runAllScenarios } from "../runner";

test.describe.configure({ timeout: 600_000 });

test("run all launch scenarios (serial simulation)", async ({ page }) => {
  const results = await runAllScenarios(page);

  const fails = results.filter((r) => r.status === "FAIL");
  expect(
    fails,
    fails.map((f) => `${f.id} ${f.name}: ${f.detail}`).join(" | "),
  ).toEqual([]);
});
