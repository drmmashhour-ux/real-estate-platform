/**
 * Phase 5 — Closing room + onboarding (anonymous smoke).
 * Run: pnpm exec tsx scripts/phase5-validation.ts
 */
import {
  assertServerReady,
  fetchJson,
  getValidationBase,
  printPhaseHeader,
  summarize,
} from "./lecipm-phase-validation-shared";

async function main(): Promise<void> {
  printPhaseHeader(5, "Closing room + asset onboarding");
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

  await run("Server /api/ready", async () => ({
    ok: await assertServerReady(base),
    detail: base,
  }));

  await run("GET /api/closing/pipeline/summary (→ 401 anonymous)", async () => {
    const { res } = await fetchJson(`${base}/api/closing/pipeline/summary`);
    return { ok: res.status === 401, detail: `status ${res.status}` };
  });

  summarize(failed, 5);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
