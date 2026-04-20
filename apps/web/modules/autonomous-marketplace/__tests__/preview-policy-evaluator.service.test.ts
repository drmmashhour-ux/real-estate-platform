import { describe, expect, it, vi } from "vitest";
import { evaluatePreviewPoliciesForListing } from "../policy/preview-policy-evaluator.service";
import type { ObservationSnapshot, Opportunity, ProposedAction } from "../types/domain.types";

vi.mock("../policy/policy-engine", () => ({
  evaluateListingPreviewPolicyFromContext: vi.fn().mockReturnValue({
    id: "pol1",
    actionId: "a1",
    disposition: "ALLOW_DRY_RUN",
    violations: [],
    warnings: [],
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    ruleResults: [{ ruleCode: "pricing_guardrail", result: "passed" }],
  }),
}));

vi.mock("../execution/policy-context-builder", () => ({
  buildPolicyContext: vi.fn().mockResolvedValue({}),
}));

describe("evaluatePreviewPoliciesForListing", () => {
  it("annotates preview disposition without throwing", async () => {
    const pa: ProposedAction = {
      id: "pa1",
      type: "CREATE_TASK",
      target: { type: "fsbo_listing", id: "x" },
      confidence: 0.5,
      risk: "LOW",
      title: "t",
      explanation: "e",
      humanReadableSummary: "h",
      metadata: {},
      suggestedAt: "2026-01-01T00:00:00.000Z",
      sourceDetectorId: "preview_metric_pipeline",
      opportunityId: "opp1",
    };

    const opp: Opportunity = {
      id: "opp1",
      detectorId: "preview_metric_pipeline",
      title: "Test",
      explanation: "e",
      confidence: 0.5,
      risk: "LOW",
      evidence: {},
      proposedActions: [pa],
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const observation: ObservationSnapshot = {
      id: "o",
      target: { type: "fsbo_listing", id: "x" },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: "2026-01-01T00:00:00.000Z",
    };

    const decisions = await evaluatePreviewPoliciesForListing({
      observation,
      opportunities: [opp],
      autonomyMode: "OFF",
    });

    expect(decisions.length).toBe(1);
    expect(decisions[0]?.ruleResults.some((r) => r.ruleCode === "preview_pipeline_disposition")).toBe(true);
  });
});
