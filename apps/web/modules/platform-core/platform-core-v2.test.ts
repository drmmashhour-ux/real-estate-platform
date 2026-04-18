import { describe, it, expect, vi } from "vitest";
import { computeDecisionPriorityFields } from "./platform-core-priority.service";
import { detectDecisionDependencies } from "./platform-core-dependency.service";
import { detectCoreConflicts } from "./platform-core-conflict.service";
import type { CoreDecisionRecord } from "./platform-core.types";

function baseDecision(over: Partial<CoreDecisionRecord> = {}): CoreDecisionRecord {
  return {
    id: "d1",
    source: "ADS",
    entityType: "CAMPAIGN",
    entityId: "c1",
    title: "Scale budget",
    summary: "s",
    reason: "r",
    confidenceScore: 0.8,
    status: "PENDING",
    actionType: "SCALE_CAMPAIGN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("platform core v2 priority", () => {
  it("scores pending higher than terminal executed decisions", () => {
    const p = computeDecisionPriorityFields(baseDecision({ status: "PENDING" }));
    const e = computeDecisionPriorityFields(baseDecision({ status: "EXECUTED" }));
    expect(p.urgency).toBeGreaterThan(e.urgency);
    expect(p.priorityScore).toBeGreaterThan(e.priorityScore);
  });

  it("uses trustScore from metadata when present", () => {
    const a = computeDecisionPriorityFields(
      baseDecision({ metadata: { trustScore: 0.9, profitImpact: 0.8 } }),
    );
    const b = computeDecisionPriorityFields(
      baseDecision({ metadata: { trustScore: 0.4, profitImpact: 0.8 } }),
    );
    expect(a.priorityScore).toBeGreaterThan(b.priorityScore);
  });
});

describe("platform core v2 dependencies", () => {
  it("links CRO to ADS traffic-style decisions", () => {
    const cro = baseDecision({
      id: "cro1",
      source: "CRO",
      entityType: "SURFACE",
      title: "Improve checkout funnel",
      actionType: "PRIORITIZE_VARIANT",
    });
    const ads = baseDecision({
      id: "ads1",
      source: "ADS",
      entityType: "CAMPAIGN",
      title: "Increase traffic to listing",
      actionType: "SCALE_CAMPAIGN",
    });
    const edges = detectDecisionDependencies([cro, ads]);
    expect(edges.some((e) => e.decisionId === "cro1" && e.dependsOnDecisionId === "ads1")).toBe(true);
  });
});

describe("platform core v2 conflicts", () => {
  it("detects scale vs pause on same entity", () => {
    const a = baseDecision({
      id: "a1",
      entityId: "E1",
      title: "Scale campaign budget",
      actionType: "SCALE_CAMPAIGN",
    });
    const b = baseDecision({
      id: "b1",
      entityId: "E1",
      title: "Pause spend",
      actionType: "PAUSE_CAMPAIGN",
    });
    const c = detectCoreConflicts([a, b]);
    expect(c.some((x) => x.kind === "ENTITY_ACTION")).toBe(true);
  });
});

describe("platform core v2 simulation", () => {
  it("returns heuristic estimate when flags enabled", async () => {
    vi.resetModules();
    process.env.FEATURE_PLATFORM_CORE_V1 = "true";
    process.env.FEATURE_PLATFORM_CORE_SIMULATION_V1 = "true";
    const { simulateDecisionImpact } = await import("./platform-core-simulation.service");
    const r = simulateDecisionImpact(baseDecision({ metadata: { trustScore: 0.72 } }));
    expect(r).not.toBeNull();
    expect(r?.label).toBe("heuristic_estimate");
    expect(r?.risks.length).toBeGreaterThan(0);
    expect((r?.notes ?? []).length).toBeGreaterThan(0);
  });
});

describe("platform core v2 scheduler", () => {
  it("no-ops when scheduler flag off", async () => {
    vi.resetModules();
    delete process.env.FEATURE_PLATFORM_CORE_SCHEDULER_V1;
    process.env.FEATURE_PLATFORM_CORE_V1 = "true";
    const { getDueDecisions, runScheduledEvaluations } = await import("./platform-core-scheduler.service");
    expect(await getDueDecisions()).toEqual([]);
    expect(await runScheduledEvaluations()).toEqual({ processed: 0 });
  });
});

describe("platform core v2 brain feedback export", () => {
  it("exports emitPlatformCoreBrainFeedback for service wiring", async () => {
    const mod = await import("./brain-outcome-ingestion.service");
    expect(typeof mod.emitPlatformCoreBrainFeedback).toBe("function");
  });
});

describe("platform core v2 lifecycle history tolerance", () => {
  it("accepts only objects with string status and changedAt (mirrors getDecisionLifecycle filter)", () => {
    const raw = [
      { status: "PENDING", changedAt: "2020-01-01T00:00:00.000Z" },
      42,
      null,
      { status: "X" },
      { changedAt: "2020-01-02T00:00:00.000Z" },
    ];
    const filtered = (raw as unknown[]).filter(
      (e): e is { status: string; changedAt: string } =>
        e !== null && typeof e === "object" && !Array.isArray(e) &&
        typeof (e as { status?: unknown }).status === "string" &&
        typeof (e as { changedAt?: unknown }).changedAt === "string",
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0]!.status).toBe("PENDING");
  });
});
