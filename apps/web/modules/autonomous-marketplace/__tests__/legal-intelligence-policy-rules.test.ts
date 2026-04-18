import { describe, expect, it } from "vitest";
import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import type { ObservationSnapshot, ProposedAction } from "../types/domain.types";
import type { PolicyContext } from "../policy/policy-context";
import {
  evaluateLegalIntelCrossEntityConflict,
  evaluateLegalIntelDuplicateDocument,
  evaluateLegalIntelResubmissionLoop,
  evaluateLegalIntelReviewBacklog,
} from "../policy/rules/legal-intelligence.rules";

const mockAction: ProposedAction = {
  id: "a1",
  type: "UPDATE_LISTING_COPY",
  target: { type: "fsbo_listing", id: "lst" },
  confidence: 0.6,
  risk: "LOW",
  title: "test",
  explanation: "test",
  humanReadableSummary: "test",
  metadata: {},
  suggestedAt: "2026-04-01T12:00:00.000Z",
  sourceDetectorId: "det",
  opportunityId: "opp",
};

const mockObservation: ObservationSnapshot = {
  id: "obs",
  target: { type: "fsbo_listing", id: "lst" },
  signals: [],
  aggregates: {},
  facts: {},
  builtAt: "2026-04-01T12:00:00.000Z",
};

function ctx(params: Partial<PolicyContext> & { summary?: LegalIntelligenceSummary | null }): PolicyContext {
  const { summary, ...rest } = params;
  return {
    action: mockAction,
    observation: mockObservation,
    autonomyMode: "ASSIST",
    targetActive: true,
    activePromotionCount: 0,
    priceDeltaTodayPct: 0,
    legalIntelligenceSummary: summary ?? null,
    ...rest,
  };
}

describe("legal intelligence policy rules", () => {
  it("warns on resubmission loop signals", () => {
    const summary: LegalIntelligenceSummary = {
      builtAt: "2026-04-01T12:00:00.000Z",
      entityType: "fsbo_listing",
      entityId: "lst",
      countsBySeverity: { info: 0, warning: 0, critical: 0 },
      countsBySignalType: { suspicious_resubmission_pattern: 3 },
      totalSignals: 3,
      topAnomalyKinds: [],
      topFraudIndicatorLabels: [],
      freshnessNote: "",
    };
    const r = evaluateLegalIntelResubmissionLoop(ctx({ summary }));
    expect(r.result).toBe("warning");
  });

  it("blocks duplicate document threshold", () => {
    const summary: LegalIntelligenceSummary = {
      builtAt: "2026-04-01T12:00:00.000Z",
      entityType: "fsbo_listing",
      entityId: "lst",
      countsBySeverity: { info: 0, warning: 0, critical: 2 },
      countsBySignalType: { duplicate_document: 2 },
      totalSignals: 2,
      topAnomalyKinds: [],
      topFraudIndicatorLabels: [],
      freshnessNote: "",
    };
    const r = evaluateLegalIntelDuplicateDocument(ctx({ summary }));
    expect(r.result).toBe("blocked");
  });

  it("cross-entity conflict warns when repeated", () => {
    const summary: LegalIntelligenceSummary = {
      builtAt: "2026-04-01T12:00:00.000Z",
      entityType: "fsbo_listing",
      entityId: "lst",
      countsBySeverity: { info: 0, warning: 2, critical: 0 },
      countsBySignalType: { cross_entity_conflict: 2 },
      totalSignals: 2,
      topAnomalyKinds: [],
      topFraudIndicatorLabels: [],
      freshnessNote: "",
    };
    const r = evaluateLegalIntelCrossEntityConflict(ctx({ summary }));
    expect(r.result).toBe("warning");
  });

  it("review backlog blocks only when combined thresholds met", () => {
    const summary: LegalIntelligenceSummary = {
      builtAt: "2026-04-01T12:00:00.000Z",
      entityType: "fsbo_listing",
      entityId: "lst",
      countsBySeverity: { info: 0, warning: 0, critical: 3 },
      countsBySignalType: { review_delay_risk: 2, missing_required_cluster: 1 },
      totalSignals: 3,
      topAnomalyKinds: [],
      topFraudIndicatorLabels: [],
      freshnessNote: "",
    };
    const r = evaluateLegalIntelReviewBacklog(ctx({ summary }));
    expect(r.result).toBe("blocked");
  });
});
