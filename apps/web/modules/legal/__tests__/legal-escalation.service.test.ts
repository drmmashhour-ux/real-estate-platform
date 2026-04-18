import { describe, expect, it } from "vitest";
import type { LegalIntelligenceSummary } from "../legal-intelligence.types";
import { buildLegalEscalationNote, recommendLegalEscalation } from "../legal-escalation.service";

describe("recommendLegalEscalation", () => {
  it("returns standard when empty summary", () => {
    expect(recommendLegalEscalation(null).recommendation).toBe("standard_review");
  });

  it("recommends senior review on multiple critical signals", () => {
    const s: LegalIntelligenceSummary = {
      builtAt: "2026-04-01T12:00:00.000Z",
      entityType: "fsbo_listing",
      entityId: "lst1",
      countsBySeverity: { info: 0, warning: 1, critical: 2 },
      countsBySignalType: {},
      totalSignals: 3,
      topAnomalyKinds: [],
      topFraudIndicatorLabels: [],
      freshnessNote: "",
    };
    expect(recommendLegalEscalation(s).recommendation).toBe("senior_review_recommended");
  });
});

describe("buildLegalEscalationNote", () => {
  it("never throws", () => {
    expect(() =>
      buildLegalEscalationNote({
        id: "q",
        entityType: "fsbo_listing",
        entityId: "lst",
        workflowType: "w",
        submittedAt: "2026-04-01T12:00:00.000Z",
        label: "x",
      }),
    ).not.toThrow();
  });
});
