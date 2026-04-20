import { describe, expect, it } from "vitest";
import { buildPreviewExplanation } from "../preview-explainability-builder.service";
import type { ListingObservationSnapshot } from "../../types/listing-observation-snapshot.types";
import type { ObservationSnapshot, Opportunity, PolicyDecision, ProposedAction } from "../../types/domain.types";

describe("buildPreviewExplanation", () => {
  it("caps graph nodes and edges within limits", () => {
    const metrics: ListingObservationSnapshot = {
      views: 1,
      bookings: 0,
      conversionRate: 0,
      price: null,
      listingStatus: "DRAFT",
    };

    const observation: ObservationSnapshot = {
      id: "o",
      target: { type: "fsbo_listing", id: "z" },
      signals: [],
      aggregates: {},
      facts: { metrics },
      builtAt: "2026-01-01T00:00:00.000Z",
    };

    const proposed: ProposedAction = {
      id: "pa",
      type: "CREATE_TASK",
      target: { type: "fsbo_listing", id: "z" },
      confidence: 0.5,
      risk: "LOW",
      title: "Task",
      explanation: "e",
      humanReadableSummary: "h",
      metadata: { previewReason: "reason" },
      suggestedAt: "2026-01-01T00:00:00.000Z",
      sourceDetectorId: "preview_metric_pipeline",
      opportunityId: "opp",
    };

    const opp: Opportunity = {
      id: "opp",
      detectorId: "preview_metric_pipeline",
      title: "Opp",
      explanation: "e",
      confidence: 0.5,
      risk: "LOW",
      evidence: { signalRef: "preview-sig-x" },
      proposedActions: [proposed],
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const policy: PolicyDecision = {
      id: "pol",
      actionId: proposed.id,
      disposition: "ALLOW_DRY_RUN",
      violations: [],
      warnings: [],
      evaluatedAt: "2026-01-01T00:00:00.000Z",
      ruleResults: [],
    };

    const explanation = buildPreviewExplanation({
      listingId: "z",
      metrics,
      observation,
      signals: [],
      opportunities: [opp],
      proposedActions: [proposed],
      policyDecisions: [policy],
    });

    expect(explanation.graph.nodes.length).toBeLessThanOrEqual(25);
    expect(explanation.graph.edges.length).toBeLessThanOrEqual(35);
  });
});
