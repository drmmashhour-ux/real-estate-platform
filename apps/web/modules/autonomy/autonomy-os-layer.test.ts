import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/autonomy/lib/autonomy-layer-gate", () => ({
  isAutonomyOsActionsEnabled: () => true,
  isAutonomyOsDynamicPricingEnabled: () => true,
  isAutonomyOsLearningEnabled: () => true,
  isAutonomyOsPortfolioEnabled: () => true,
  isAutonomyOsDashboardEnabled: () => true,
  isAutonomyOsLayerCoreEnabled: () => true,
}));

import { allocatePortfolioCapital } from "./portfolio/capital-allocator.service";
import { executeAutonomyAction } from "./actions/autonomy-actions.service";
import { buildLearningSnapshot } from "./learning/learning-engine.service";
import {
  approveProposedAction,
  createProposedAction,
  markExecuted,
} from "./engine/autonomy-orchestrator.service";
import {
  getAutonomousSystemHealth,
  pauseAutonomy,
  resetAutonomyGovernanceForTests,
  resumeAutonomy,
} from "./engine/autonomy-governance.service";
import { evaluateAutonomyPolicies } from "./policy/autonomy-policy.service";
import { resetAutonomyPolicyMonitoringForTests } from "./policy/autonomy-policy-monitoring.service";
import type { OutcomeEvent } from "./types/autonomy.types";

describe("autonomy OS layer", () => {
  beforeEach(() => {
    resetAutonomyPolicyMonitoringForTests();
    resetAutonomyGovernanceForTests();
  });

  it("policy engine blocks OFF mode", () => {
    const r = evaluateAutonomyPolicies({
      mode: "OFF",
      domain: "PRICING",
    });
    expect(r.allowed).toBe(false);
  });

  it("pricing respects max price cap", async () => {
    const { buildDynamicPricingDecision } = await import(
      "@/modules/autonomy/pricing/dynamic-pricing.service"
    );
    const decision = buildDynamicPricingDecision(
      {
        listingId: "1",
        basePrice: 200,
        occupancyRate: 0.9,
        bookingVelocity: 0.9,
        localDemandIndex: 0.95,
        minPrice: 150,
        maxPrice: 210,
      },
      "SAFE_AUTOPILOT",
    );
    expect(decision.suggestedPrice).toBeLessThanOrEqual(210);
  });

  it("learning snapshot aggregates outcomes", () => {
    const events: OutcomeEvent[] = [
      {
        id: "e1",
        actionId: "a1",
        entityId: "x",
        entityType: "LISTING",
        domain: "PRICING",
        metric: "revenue_delta",
        delta: 10,
        label: "POSITIVE",
        observedAt: new Date().toISOString(),
      },
      {
        id: "e2",
        actionId: "a1",
        entityId: "x",
        entityType: "LISTING",
        domain: "PRICING",
        metric: "revenue_delta",
        delta: -2,
        label: "NEGATIVE",
        observedAt: new Date().toISOString(),
      },
    ];
    const snap = buildLearningSnapshot(events);
    expect(snap.totalActions).toBe(2);
    expect(snap.positiveOutcomes).toBe(1);
    expect(snap.negativeOutcomes).toBe(1);
  });

  it("orchestrator sets pending approval under ASSIST", () => {
    const action = createProposedAction({
      domain: "PRICING",
      type: "adjust_price",
      title: "t",
      description: "d",
      mode: "ASSIST",
      payload: {},
    });
    expect(action.status).toBe("PENDING_APPROVAL");
  });

  it("capital allocator ranks buildings", () => {
    const dec = allocatePortfolioCapital(
      [
        { id: "b1", riskScore: 20, expectedYieldScore: 70, maintenanceUrgencyScore: 40 },
        { id: "b2", riskScore: 60, expectedYieldScore: 55, maintenanceUrgencyScore: 30 },
      ],
      80000,
    );
    expect(dec.length).toBeGreaterThan(0);
    expect(dec[0]?.buildingId).toBeDefined();
  });

  it("governance pause reflected in health", () => {
    pauseAutonomy();
    const h = getAutonomousSystemHealth([]);
    expect(h.isPaused).toBe(true);
    resumeAutonomy();
    expect(getAutonomousSystemHealth([]).isPaused).toBe(false);
  });

  it("approve + execute flow", async () => {
    let a = createProposedAction({
      domain: "CONTENT",
      type: "draft",
      title: "t",
      description: "d",
      mode: "SAFE_AUTOPILOT",
      payload: { x: 1 },
    });
    if (a.status === "DRAFT") {
      a = approveProposedAction(a);
    }
    const run = await executeAutonomyAction(a);
    expect(run.success).toBe(true);
    expect(markExecuted(a).status).toBe("EXECUTED");
  });
});
