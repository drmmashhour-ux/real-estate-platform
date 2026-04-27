import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockWrite, mockInsert, mockFlags } = vi.hoisted(() => ({
  mockWrite: vi.fn().mockResolvedValue(undefined),
  mockInsert: vi.fn().mockResolvedValue({ id: "run-1" }),
  mockFlags: { AUTONOMOUS_OPTIMIZATION_LOOP: true },
}));

vi.mock("@/lib/analytics/tracker", () => ({
  writeMarketplaceEvent: (...a: unknown[]) => mockWrite(...a),
  trackEvent: (...a: unknown[]) => mockWrite(...a),
}));

vi.mock("@/lib/flags", () => ({
  flags: mockFlags,
}));

vi.mock("@/lib/growth/autonomousOptimizationPersistence", () => ({
  insertLecipmAutonomousOptimizationRun: (...a: unknown[]) => mockInsert(...a),
}));

vi.mock("@/lib/growth/autonomousOptimizationInputs", () => ({
  loadBrainOptimizationActions: vi.fn().mockResolvedValue([]),
  loadSearchDemandActions: vi.fn().mockResolvedValue([]),
}));

import { runAutonomousOptimizationLoop, sortActionsByPriority } from "@/lib/growth/autonomousOptimizationLoop";
import type { AutonomousOptimizationAction } from "@/lib/growth/autonomousOptimizationLoop";

describe("autonomous optimization loop (Order 11+)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.AUTONOMOUS_OPTIMIZATION_LOOP = true;
  });

  it("disabled flag returns safe disabled result", async () => {
    mockFlags.AUTONOMOUS_OPTIMIZATION_LOOP = false;
    const r = await runAutonomousOptimizationLoop({ dryRun: true });
    expect(r.ok).toBe(false);
    expect(r.disabled).toBe(true);
    expect(r.runId).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("one failing input module does not break the run", async () => {
    const boom: () => Promise<AutonomousOptimizationAction[]> = async () => {
      throw new Error("simulated input failure");
    };
    const ok: () => Promise<AutonomousOptimizationAction[]> = async () => [
      { id: "a1", area: "growth", priority: "high", safeToAutomate: false, title: "T" },
    ];
    const r = await runAutonomousOptimizationLoop({
      dryRun: true,
      inputProviders: [boom, ok],
    });
    expect(r.ok).toBe(true);
    expect(r.inputErrors.length).toBe(1);
    expect(r.inputErrors[0]).toContain("simulated");
    expect(r.actions.map((a) => a.id)).toContain("a1");
  });

  it("persists a run and emits one event per action", async () => {
    const prov = async () => [
      { id: "x", area: "pricing", priority: "medium" as const, safeToAutomate: false, title: "P" },
    ];
    const r = await runAutonomousOptimizationLoop({ dryRun: true, inputProviders: [prov] });
    expect(r.runId).toBe("run-1");
    expect(mockInsert).toHaveBeenCalled();
    const actionEvents = mockWrite.mock.calls.filter((c) => c[0] === "autonomous_optimization_action_generated");
    expect(actionEvents).toHaveLength(1);
    expect(actionEvents[0]![1]).toMatchObject({ area: "pricing", priority: "medium", safeToAutomate: false });
  });

  it("actions are sorted by priority: high → medium → low", () => {
    const a: AutonomousOptimizationAction[] = [
      { id: "l", area: "a", priority: "low", safeToAutomate: true, title: "L" },
      { id: "h", area: "a", priority: "high", safeToAutomate: true, title: "H" },
      { id: "m", area: "a", priority: "medium", safeToAutomate: true, title: "M" },
    ];
    const s = sortActionsByPriority(a);
    expect(s.map((x) => x.id).join(",")).toBe("h,m,l");
  });
});
