import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("proposalsRetargetingAutopilot", () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    process.env.FEATURE_GROWTH_MACHINE_V1 = "true";
    process.env.FEATURE_AI_AUTOPILOT_V1 = "true";
    process.env.FEATURE_AI_AUTOPILOT_GROWTH_V1 = "true";
  });

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("returns empty when growth autopilot flags off", async () => {
    delete process.env.FEATURE_GROWTH_MACHINE_V1;
    const { proposalsRetargetingAutopilot } = await import("./retargeting.autopilot.adapter");
    expect(proposalsRetargetingAutopilot("u1")).toEqual([]);
  });

  it("returns three actions with unified confidence on all when gates on", async () => {
    const { proposalsRetargetingAutopilot } = await import("./retargeting.autopilot.adapter");
    const out = proposalsRetargetingAutopilot("u1");
    expect(out.length).toBe(3);
    for (const a of out) {
      expect(a.reasons && typeof a.reasons === "object" && "confidence" in a.reasons).toBe(true);
      expect(typeof (a.reasons as { confidence: number }).confidence).toBe("number");
      expect(Number.isFinite((a.reasons as { confidence: number }).confidence)).toBe(true);
    }
    const hi = out.find((x) => x.entityId === "high_intent");
    expect(hi?.reasons && typeof hi.reasons === "object" && "monitorHold" in hi.reasons).toBe(true);
  });
});
