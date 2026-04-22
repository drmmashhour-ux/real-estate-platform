import { describe, expect, it } from "vitest";

import { assignSoinsBadge, BADGE_ELITE_MIN_OVERALL } from "../soins-quality-badge.service";
import { computeSoinsQualityScores, mergeSoinsSignals, createBaselineSignals } from "../soins-quality-score.service";
import type { SoinsQualitySignals } from "../soins-quality.types";

describe("soins-quality-badge.service", () => {
  it("blocks ELITE when critical unresolved operational issues are true", () => {
    const base = mergeSoinsSignals(createBaselineSignals(90), {
      avgAlertResponseMinutes: 8,
      familyMessageResponseRate: 0.98,
      mealCompletionRate: 0.99,
      missedMealsPer100ResidentDays: 0,
      alertResolutionWithinPolicyRate: 0.98,
      documentedCareCompletenessRatio: 0.95,
      structuredFeedbackScoreAvg: 92,
      transparencyDocumentationTimeliness: 0.95,
      operatorProfileCompleteness: 0.95,
      criticalUnresolvedOperationalIssues: true,
    });
    const computed = computeSoinsQualityScores(base);
    expect(computed.overallScore).toBeGreaterThanOrEqual(BADGE_ELITE_MIN_OVERALL);
    const badge = assignSoinsBadge(computed, base);
    expect(badge.badgeLevel).toBe("STANDARD");
    expect(badge.reasons.some((r) => /capped/i.test(r) || /critical/i.test(r))).toBe(true);
  });

  it("allows ELITE when score threshold met and no critical flags", () => {
    const s: SoinsQualitySignals = mergeSoinsSignals(createBaselineSignals(90), {
      avgAlertResponseMinutes: 10,
      familyMessageResponseRate: 0.96,
      mealCompletionRate: 0.98,
      missedMealsPer100ResidentDays: 0.4,
      alertResolutionWithinPolicyRate: 0.96,
      avgNonCriticalAlertResolutionMinutes: 90,
      documentedCareCompletenessRatio: 0.94,
      complaintsPer1000ResidentDays: 1,
      structuredFeedbackScoreAvg: 90,
      transparencyDocumentationTimeliness: 0.92,
      operatorProfileCompleteness: 0.9,
      criticalUnresolvedOperationalIssues: false,
    });
    const computed = computeSoinsQualityScores(s);
    const badge = assignSoinsBadge(computed, s);
    expect(computed.overallScore).toBeGreaterThanOrEqual(BADGE_ELITE_MIN_OVERALL);
    expect(badge.badgeLevel).toBe("ELITE");
  });
});
