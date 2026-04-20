import { describe, expect, it } from "vitest";
import { buildPreviewActions } from "../execution/preview-action-builder.service";
import type { Opportunity, PolicyDecision, ProposedAction } from "../types/domain.types";

describe("preview action pipeline (unit)", () => {
  it("filters blocked_in_preview policies", () => {
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
      opportunityId: "o1",
    };

    const opp: Opportunity = {
      id: "o1",
      detectorId: "preview_metric_pipeline",
      title: "o",
      explanation: "e",
      confidence: 0.5,
      risk: "LOW",
      evidence: {},
      proposedActions: [pa],
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const blocked: PolicyDecision = {
      id: "p1",
      actionId: pa.id,
      disposition: "BLOCK",
      violations: [],
      warnings: [],
      evaluatedAt: "2026-01-01T00:00:00.000Z",
      ruleResults: [
        {
          ruleCode: "preview_pipeline_disposition",
          result: "blocked",
          reason: "Preview disposition: blocked_in_preview",
        },
      ],
    };

    const actions = buildPreviewActions({
      opportunities: [opp],
      policyDecisions: [blocked],
    });

    expect(actions.length).toBe(0);
  });
});
