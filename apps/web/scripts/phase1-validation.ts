/**
 * Phase 1 — ESG + acquisition foundation (smoke).
 * Run: pnpm exec tsx scripts/phase1-validation.ts
 * Expect: dev server on VALIDATION_BASE_URL (default :3001).
 */
import {
  assertServerReady,
  fetchJson,
  getValidationBase,
  printPhaseHeader,
  summarize,
} from "./lecipm-phase-validation-shared";

async function main(): Promise<void> {
  printPhaseHeader(1, "ESG + acquisition foundation");
  const base = getValidationBase();
  let failed = 0;

  const run = async (name: string, fn: () => Promise<{ ok: boolean; detail?: string }>) => {
    try {
      const r = await fn();
      if (r.ok) console.log(`PASS ${name}${r.detail ? ` — ${r.detail}` : ""}`);
      else {
        failed++;
        console.log(`FAIL ${name}${r.detail ? ` — ${r.detail}` : ""}`);
      }
    } catch (e) {
      failed++;
      console.log(`FAIL ${name} — ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  await run("Server /api/ready", async () => {
    const ok = await assertServerReady(base);
    return { ok, detail: ok ? base : `not reachable (${base})` };
  });

  await run("GET /api/esg/profile (no listingId → 400 or 401)", async () => {
    const { res } = await fetchJson(`${base}/api/esg/profile`);
    return { ok: res.status === 400 || res.status === 401, detail: `status ${res.status}` };
  });

  await run("GET /api/esg/actions (no listingId → 400 or 401)", async () => {
    const { res } = await fetchJson(`${base}/api/esg/actions`);
    return { ok: res.status === 400 || res.status === 401, detail: `status ${res.status}` };
  });

  await run("POST /api/acquisition/screen (invalid JSON → 400)", async () => {
    const res = await fetch(`${base}/api/acquisition/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    return { ok: res.status === 400, detail: `status ${res.status}` };
  });

  await run("POST /api/acquisition/screen (valid body — 401 without session or 200 if rollout off)", async () => {
    const { res } = await fetchJson(`${base}/api/acquisition/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: 500000,
        adr: 120,
        occupancyRate: 0.7,
        monthlyCost: 3000,
      }),
    });
    const ok = res.status === 401 || res.status === 200;
    return { ok, detail: `status ${res.status}` };
  });

  summarize(failed, 1);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
