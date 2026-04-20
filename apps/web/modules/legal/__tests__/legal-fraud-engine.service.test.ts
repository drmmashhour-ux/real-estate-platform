import { describe, expect, it } from "vitest";
import {
  buildLegalFraudEngineSummary,
  normalizeLegalFraudIndicators,
} from "../legal-fraud-engine.service";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";

const base: LegalIntelligenceSignal = {
  id: "s1",
  signalType: "duplicate_document",
  severity: "warning",
  entityType: "fsbo_listing",
  entityId: "L1",
  actorType: "seller",
  workflowType: "test",
  observedAt: "2026-01-01T00:00:00.000Z",
  explanation: "Test",
  metadata: {},
};

describe("legal-fraud-engine.service", () => {
  it("uses non-accusatory label text", () => {
    const out = normalizeLegalFraudIndicators([base]);
    expect(out[0]?.label.toLowerCase()).not.toContain("fraud committed");
    expect(out[0]?.label.toLowerCase()).toContain("possible");
  });

  it("maps review posture deterministically", () => {
    const indicators = normalizeLegalFraudIndicators([base]);
    expect(indicators[0]?.recommendedReviewPosture).toBeTruthy();
    const summary = buildLegalFraudEngineSummary({
      builtAt: "2026-01-01T00:00:00.000Z",
      signals: [base],
      indicators,
    });
    expect(summary.indicatorCount).toBe(1);
    expect(summary.signalCount).toBe(1);
  });
});
