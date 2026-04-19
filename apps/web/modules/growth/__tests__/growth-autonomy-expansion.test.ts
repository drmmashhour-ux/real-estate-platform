import { describe, it, expect, beforeEach } from "vitest";

import { expansionAdjacencyIsAllowed, isExpansionTargetWithinSafeClass } from "../growth-autonomy-expansion-boundaries";
import { GROWTH_AUTONOMY_EXPANSION_CANDIDATES } from "../growth-autonomy-expansion-candidates";
import { explainSafeAutoExecutionAllowed } from "../growth-autonomy-execution-explainer.service";
import { resetGrowthAutonomyExpansionMonitoringForTests } from "../growth-autonomy-expansion-monitoring.service";

describe("expansion boundaries", () => {
  it("rejects non-adjacent identical keys", () => {
    expect(expansionAdjacencyIsAllowed("create_internal_review_task", "create_internal_review_task")).toBe(false);
  });

  it("allows adjacent internal keys from safe class", () => {
    expect(
      expansionAdjacencyIsAllowed("create_internal_review_task", "mark_target_for_operator_attention"),
    ).toBe(true);
  });

  it("marks risky-looking strings as unsafe", () => {
    expect(isExpansionTargetWithinSafeClass("payment_auto_execute")).toBe(false);
  });
});

describe("expansion candidates", () => {
  it("keeps a small fixed catalog", () => {
    expect(GROWTH_AUTONOMY_EXPANSION_CANDIDATES.length).toBeGreaterThan(0);
    expect(GROWTH_AUTONOMY_EXPANSION_CANDIDATES.length).toBeLessThanOrEqual(8);
  });
});

describe("deterministic explanations", () => {
  it("matches for identical explainer inputs", () => {
    const a = explainSafeAutoExecutionAllowed({
      catalogLabel: "X",
      lowRiskActionKey: "create_internal_review_task",
      rolloutStageLabel: "internal",
    });
    expect(
      explainSafeAutoExecutionAllowed({
        catalogLabel: "X",
        lowRiskActionKey: "create_internal_review_task",
        rolloutStageLabel: "internal",
      }),
    ).toBe(a);
  });
});

describe("expansion monitoring", () => {
  beforeEach(() => {
    resetGrowthAutonomyExpansionMonitoringForTests();
  });

  it("reset clears snapshot", async () => {
    const { recordExpansionAuditBlocked, getGrowthAutonomyExpansionMonitoringSnapshot } = await import(
      "../growth-autonomy-expansion-monitoring.service"
    );
    recordExpansionAuditBlocked();
    expect(getGrowthAutonomyExpansionMonitoringSnapshot().auditBlocked).toBe(1);
    resetGrowthAutonomyExpansionMonitoringForTests();
    expect(getGrowthAutonomyExpansionMonitoringSnapshot().auditBlocked).toBe(0);
  });
});
