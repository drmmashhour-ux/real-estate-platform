/**
 * Phase 7 — Multi-agent executive layer (anonymous smoke).
 * Run: pnpm exec tsx scripts/phase7-validation.ts
 */
import {
  assertServerReady,
  fetchJson,
  getValidationBase,
  printPhaseHeader,
  summarize,
} from "./lecipm-phase-validation-shared";

async function main(): Promise<void> {
  printPhaseHeader(7, "Multi-agent executive command center");
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

  await run("POST /api/agents/execute (invalid JSON — anonymous → 401 auth before parse)", async () => {
    const res = await fetch(`${base}/api/agents/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    return { ok: res.status === 401, detail: `status ${res.status}` };
  });

  await run("POST /api/agents/execute (missing fields → 401)", async () => {
    const { res } = await fetchJson(`${base}/api/agents/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "PORTFOLIO", entityId: "x", triggerType: "MANUAL_EXECUTE" }),
    });
    return { ok: res.status === 401 || res.status === 403, detail: `status ${res.status}` };
  });

  await run("GET /api/agents/briefing (→ 401 anonymous)", async () => {
    const { res } = await fetchJson(`${base}/api/agents/briefing`);
    return { ok: res.status === 401 || res.status === 403, detail: `status ${res.status}` };
  });

  summarize(failed, 7);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
