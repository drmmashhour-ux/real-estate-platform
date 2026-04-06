/**
 * Cross-broker CRM isolation: each broker must get 403 on the other's lead via API.
 * Prereq: pnpm seed:qa-blockers (creates brokers + leads — see lib/e2e/broker-isolation-constants.ts).
 *
 * PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm exec playwright test e2e/broker-lead-isolation.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";
import { BROKER_ISOLATION_SEED } from "@/lib/e2e/broker-isolation-constants";
import { dismissCommonOverlays } from "./helpers/overlays";

test.describe.configure({ timeout: 120_000, mode: "serial" });

test.use({ viewport: { width: 1280, height: 800 } });

async function loginAsBroker(page: Page, email: string, password: string) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await dismissCommonOverlays(page);
  const form = page.getByTestId("lecipm-auth-login-form");
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await dismissCommonOverlays(page);
  await form.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 60_000 });
}

test("brokers cannot read each other's leads (GET + playbook)", async ({ browser }) => {
  const alphaEmail = process.env.E2E_BROKER_ALPHA_EMAIL?.trim() || BROKER_ISOLATION_SEED.alphaEmail;
  const betaEmail = process.env.E2E_BROKER_BETA_EMAIL?.trim() || BROKER_ISOLATION_SEED.betaEmail;
  const pw = process.env.E2E_BROKER_PASSWORD?.trim() || BROKER_ISOLATION_SEED.password;
  const { leadAlphaId, leadBetaId } = BROKER_ISOLATION_SEED;

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  pageA.setDefaultTimeout(30_000);

  await loginAsBroker(pageA, alphaEmail, pw);

  const ownA = await pageA.request.get(`/api/leads/${leadAlphaId}`);
  expect(ownA.status(), "Alpha should read own lead").toBe(200);
  const ownJson = (await ownA.json().catch(() => ({}))) as { id?: string };
  expect(ownJson.id).toBe(leadAlphaId);

  const crossA = await pageA.request.get(`/api/leads/${leadBetaId}`);
  expect(crossA.status(), "Alpha must not read Beta's lead").toBe(403);

  const playbookCrossA = await pageA.request.get(`/api/leads/${leadBetaId}/playbook`);
  expect(playbookCrossA.status(), "Alpha must not load Beta's playbook").toBe(403);

  await ctxA.close();

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  pageB.setDefaultTimeout(30_000);

  await loginAsBroker(pageB, betaEmail, pw);

  const ownB = await pageB.request.get(`/api/leads/${leadBetaId}`);
  expect(ownB.status(), "Beta should read own lead").toBe(200);

  const crossB = await pageB.request.get(`/api/leads/${leadAlphaId}`);
  expect(crossB.status(), "Beta must not read Alpha's lead").toBe(403);

  const playbookCrossB = await pageB.request.get(`/api/leads/${leadAlphaId}/playbook`);
  expect(playbookCrossB.status(), "Beta must not load Alpha's playbook").toBe(403);

  await ctxB.close();
});
