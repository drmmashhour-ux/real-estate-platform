import { beforeEach, describe, expect, it, vi } from "vitest";
import { applySimulationRules } from "@/modules/growth/action-simulation-rules.service";
import type { SimulationActionInput, SimulationBaseline } from "@/modules/growth/action-simulation.types";
import { simulateActionOutcomeWithBaseline } from "@/modules/growth/action-simulation.service";
import { compareSimulatedActions } from "@/modules/growth/action-simulation-comparison.service";

vi.mock("@/modules/growth/action-simulation-monitoring.service", () => ({
  logSimulationBuilt: vi.fn(),
  logSimulationLowConfidence: vi.fn(),
  logSimulationCompare: vi.fn(),
}));

vi.mock("@/modules/growth/action-simulation-baseline.service", () => ({
  buildSimulationBaseline: vi.fn(),
}));

import { buildSimulationBaseline } from "@/modules/growth/action-simulation-baseline.service";

function baseBaseline(over: Partial<SimulationBaseline> = {}): SimulationBaseline {
  return {
    leads: 120,
    brokers: 18,
    listings: 340,
    conversionRate: 22,
    unlockRate: 14,
    closeRate: 18,
    revenueEstimate: 85000,
    confidence: "medium",
    warnings: [],
    ...over,
  };
}

function action(over: Partial<SimulationActionInput>): SimulationActionInput {
  return {
    id: "test",
    title: "Test",
    category: "conversion_fix",
    intensity: "medium",
    windowDays: 14,
    ...over,
  };
}

describe("applySimulationRules", () => {
  it("returns directional effects with explanations", () => {
    const b = baseBaseline();
    const fx = applySimulationRules(action({ category: "conversion_fix" }), b);
    expect(fx.length).toBeGreaterThanOrEqual(2);
    expect(fx.every((e) => e.explanation.length > 10)).toBe(true);
  });

  it("forces uncertainty for city domination without city", () => {
    const b = baseBaseline();
    const fx = applySimulationRules(action({ category: "city_domination" }), b);
    const cityRow = fx.find((e) => e.metric.includes("City"));
    expect(cityRow?.predictedDirection).toBe("uncertain");
  });
});

describe("simulateActionOutcomeWithBaseline", () => {
  it("produces overall recommendation and risks", () => {
    const out = simulateActionOutcomeWithBaseline(
      action({ category: "conversion_fix", intensity: "high" }),
      baseBaseline({ confidence: "high", warnings: [] }),
    );
    expect(["favorable", "mixed", "weak", "insufficient_data"]).toContain(out.overallRecommendation);
    expect(out.effects.length).toBeGreaterThan(0);
    expect(out.risks.length + out.assumptions.length).toBeGreaterThan(0);
  });

  it("returns insufficient_data when telemetry is sparse", () => {
    const out = simulateActionOutcomeWithBaseline(
      action({ category: "demand_generation" }),
      baseBaseline({
        confidence: "low",
        warnings: ["w1", "w2", "w3", "w4", "w5", "w6"],
        leads: 2,
      }),
    );
    expect(out.overallRecommendation).toBe("insufficient_data");
  });

  it("does not advertise payments or auto messaging", () => {
    const out = simulateActionOutcomeWithBaseline(action({ category: "routing_shift" }), baseBaseline());
    const blob = JSON.stringify(out).toLowerCase();
    expect(blob).not.toMatch(/stripe|checkout|send sms|auto-execute/);
  });
});

describe("compareSimulatedActions", () => {
  beforeEach(() => {
    vi.mocked(buildSimulationBaseline).mockResolvedValue(baseBaseline({ confidence: "high", warnings: [] }));
  });

  it("returns a winner field and rationale", async () => {
    const cmp = await compareSimulatedActions(
      action({ id: "a", title: "Focus Quebec City brokers", category: "broker_acquisition" }),
      action({ id: "b", title: "Fix Montreal conversion", category: "conversion_fix" }),
      { windowDays: 14 },
    );
    expect(["actionA", "actionB", "none", "insufficient_data"]).toContain(cmp.winner);
    expect(cmp.rationale.length).toBeGreaterThan(10);
  });
});
