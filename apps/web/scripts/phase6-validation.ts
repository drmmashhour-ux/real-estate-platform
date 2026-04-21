/**
 * Phase 6 — Portfolio intelligence (anonymous smoke).
 * Run: pnpm exec tsx scripts/phase6-validation.ts
 */
import {
  assertServerReady,
  fetchJson,
  getValidationBase,
  printPhaseHeader,
  summarize,
} from "./lecipm-phase-validation-shared";

async function main(): Promise<void> {
  printPhaseHeader(6, "Portfolio intelligence");
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

  await run("GET /api/portfolio/intelligence (→ 401 or 403 anonymous)", async () => {
    const { res } = await fetchJson(`${base}/api/portfolio/intelligence`);
    return { ok: res.status === 401 || res.status === 403, detail: `status ${res.status}` };
  });

  summarize(failed, 6);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
