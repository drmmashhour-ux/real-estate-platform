import { describe, expect, it } from "vitest";
import type { LegalIntelligenceSummary } from "../legal-intelligence.types";
import {
  computeLegalReviewPriorityScore,
  prioritizeLegalReviewQueue,
  scoreLegalQueueItem,
} from "../legal-review-priority.service";

function summary(critical: number, warning: number): LegalIntelligenceSummary {
  return {
    builtAt: "2026-04-01T12:00:00.000Z",
    entityType: "fsbo_listing",
    entityId: "lst1",
    countsBySeverity: { info: 0, warning, critical },
    countsBySignalType: {},
    totalSignals: critical + warning,
    topAnomalyKinds: [],
    topFraudIndicatorLabels: [],
    freshnessNote: "",
  };
}

describe("computeLegalReviewPriorityScore", () => {
  it("assigns urgent when critical signals stack", () => {
    const r = computeLegalReviewPriorityScore({
      criticalSignalCount: 2,
      warningSignalCount: 0,
      missingCriticalRequirements: 0,
      priorRejections: 0,
      submissionAgeHours: 0,
      workflowSensitivity: "low",
      readinessScore: 80,
      enforcementBlocking: false,
      downstreamBlocked: false,
    });
    expect(r.level).toBe("urgent");
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("does not mark urgent on low-risk normal items", () => {
    const r = computeLegalReviewPriorityScore({
      criticalSignalCount: 0,
      warningSignalCount: 0,
      missingCriticalRequirements: 0,
      priorRejections: 0,
      submissionAgeHours: 4,
      workflowSensitivity: "low",
      readinessScore: 90,
      enforcementBlocking: false,
      downstreamBlocked: false,
    });
    expect(r.level).not.toBe("urgent");
  });
});

describe("prioritizeLegalReviewQueue", () => {
  it("sorts higher priority first", () => {
    const items = [
      {
        id: "a",
        entityType: "fsbo_listing",
        entityId: "x",
        workflowType: "w",
        submittedAt: "2026-04-01T08:00:00.000Z",
        label: "low",
        criticalSignals: 0,
        warningSignals: 0,
      },
      {
        id: "b",
        entityType: "fsbo_listing",
        entityId: "y",
        workflowType: "w",
        submittedAt: "2026-04-01T08:00:00.000Z",
        label: "high",
        criticalSignals: 2,
        warningSignals: 2,
      },
    ];
    const ranked = prioritizeLegalReviewQueue(items, summary(0, 0));
    expect(ranked[0]?.itemId).toBe("b");
  });
});

describe("scoreLegalQueueItem", () => {
  it("never throws", () => {
    expect(() =>
      scoreLegalQueueItem(
        {
          id: "i",
          entityType: "fsbo_listing",
          entityId: "lst",
          workflowType: "w",
          submittedAt: new Date().toISOString(),
          label: "x",
        },
        null,
      ),
    ).not.toThrow();
  });
});
