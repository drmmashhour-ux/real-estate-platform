import { describe, expect, it } from "vitest";

import {
  computeSoinsQualityScores,
  createBaselineSignals,
  mergeSoinsSignals,
  scoreFromAlertResponseMinutes,
  scoreMealReliability,
  SOINS_CATEGORY_WEIGHTS,
} from "../soins-quality-score.service";
import type { SoinsQualitySignals } from "../soins-quality.types";

function signals(partial: Partial<SoinsQualitySignals>): SoinsQualitySignals {
  return mergeSoinsSignals(createBaselineSignals(90), partial);
}

describe("soins-quality-score.service", () => {
  it("is deterministic for identical signals", () => {
    const s = signals({});
    const a = computeSoinsQualityScores(s);
    const b = computeSoinsQualityScores(s);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.categoryBreakdown.map((c) => c.score)).toEqual(b.categoryBreakdown.map((c) => c.score));
  });

  it("fast alert response produces higher care_responsiveness than slow", () => {
    const fast = computeSoinsQualityScores(
      signals({ avgAlertResponseMinutes: 12, familyMessageResponseRate: 0.9 }),
    );
    const slow = computeSoinsQualityScores(
      signals({ avgAlertResponseMinutes: 180, familyMessageResponseRate: 0.9 }),
    );
    const fastCare = fast.categoryBreakdown.find((c) => c.key === "care_responsiveness")!.score;
    const slowCare = slow.categoryBreakdown.find((c) => c.key === "care_responsiveness")!.score;
    expect(fastCare).toBeGreaterThan(slowCare);
    expect(scoreFromAlertResponseMinutes(12)).toBeGreaterThan(scoreFromAlertResponseMinutes(180));
  });

  it("missed meals lower meal_reliability vs full completion", () => {
    const good = scoreMealReliability(0.98, 0.5);
    const bad = scoreMealReliability(0.75, 12);
    expect(good).toBeGreaterThan(bad);
    const rGood = computeSoinsQualityScores(
      signals({
        mealCompletionRate: 0.98,
        missedMealsPer100ResidentDays: 0.5,
      }),
    );
    const rBad = computeSoinsQualityScores(
      signals({
        mealCompletionRate: 0.75,
        missedMealsPer100ResidentDays: 12,
      }),
    );
    const g = rGood.categoryBreakdown.find((c) => c.key === "meal_reliability")!.score;
    const b = rBad.categoryBreakdown.find((c) => c.key === "meal_reliability")!.score;
    expect(g).toBeGreaterThan(b);
  });

  it("category weights sum to 1", () => {
    const sum = Object.values(SOINS_CATEGORY_WEIGHTS).reduce((x, y) => x + y, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
