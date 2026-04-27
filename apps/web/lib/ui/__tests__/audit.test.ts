import { describe, expect, it, vi, afterEach } from "vitest";

import { runUIAudit } from "@/lib/ui/auditHeuristics";

describe("runUIAudit (Order 52.1)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns score 0-100, nine rows, and passed+failed partition checklist", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UI_AUDIT_PERF_FAIL", "1");
    const r = await runUIAudit();
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.passed.length + r.failed.length).toBe(9);
  });

  it("can force all failed via env (smoke)", async () => {
    vi.stubEnv("UI_AUDIT_SMOKE_FAIL_ALL", "1");
    const r = await runUIAudit();
    expect(r.score).toBe(0);
    expect(r.failed.length).toBe(9);
    expect(r.passed.length).toBe(0);
  });
});
