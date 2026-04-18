import { describe, expect, it } from "vitest";
import { buildRankingV8ValidationInputsFromComparison } from "./ranking-v8-validation-scoring-bridge";
import {
  buildRankingV8ValidationScorecard,
  buildRankingV8ValidationWeeklyReport,
} from "./ranking-v8-validation-scoring.service";
import type { RankingV8ValidationInputs } from "./ranking-v8-validation-scoring.types";
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";

function baseComparison(overrides: Partial<RankingV8ComparisonResult> = {}): RankingV8ComparisonResult {
  return {
    comparedCount: 20,
    intersectionSize: 20,
    perListing: [],
    overlapTop3: 3,
    overlapTop5: 4,
    overlapTop10: 8,
    agreementRateTop3: 1,
    agreementRateTop5: 0.8,
    agreementRateTop10: 0.85,
    avgRankShift: 1,
    maxAbsRankShift: 3,
    pctMovedSignificantly: 5,
    kendallTauLike: 0.9,
    qualitySignals: {
      shadowPromotesBeyondLiveRank: [],
      shadowDemotesLiveTop: [],
      orderingInstabilityHint: false,
    },
    summary: {
      overlapTop3: 3,
      overlapTop5: 4,
      overlapTop10: 8,
      avgRankShift: 1,
      majorMovements: 0,
      stabilityScore: 0.85,
    },
    ...overrides,
  };
}

function strongInputs(): RankingV8ValidationInputs {
  return {
    quality: {
      top5OverlapRate: 0.75,
      top10OverlapRate: 0.85,
      avgRankShift: 1,
      meaningfulImprovementRate: 0.12,
    },
    stability: {
      repeatQueryConsistency: 0.95,
      top5ChurnRate: 0.08,
      largeRankJumpRate: 0.03,
    },
    userImpact: {
      ctrDelta: 0.02,
      saveRateDelta: 0.015,
      contactRateDelta: 0.01,
      leadRateDelta: 0.01,
      bookingRateDelta: 0.005,
    },
    safety: {
      influenceSkipRate: 0.15,
      shadowErrorRate: 0,
      asyncFailureRate: 0,
      rankingCrashCount: 0,
      malformedObservationRate: 0,
    },
    coverage: {
      highTrafficQueriesRepresented: true,
      lowTrafficQueriesRepresented: true,
      denseInventoryRepresented: true,
      sparseInventoryRepresented: true,
      cityZoneDiversityRepresented: true,
      priceRangeDiversityRepresented: true,
    },
  };
}

describe("buildRankingV8ValidationScorecard", () => {
  it("strong metrics → production_ready", () => {
    const card = buildRankingV8ValidationScorecard(strongInputs());
    expect(card.totalScore).toBeGreaterThanOrEqual(23);
    expect(card.decision).toBe("production_ready");
  });

  it("poor metrics → not_ready", () => {
    const card = buildRankingV8ValidationScorecard({
      quality: {
        top5OverlapRate: 0.4,
        top10OverlapRate: 0.5,
        avgRankShift: 4,
        meaningfulImprovementRate: 0.01,
      },
      stability: {
        repeatQueryConsistency: 0.5,
        top5ChurnRate: 0.5,
        largeRankJumpRate: 0.3,
      },
      userImpact: {
        ctrDelta: -0.05,
        saveRateDelta: -0.04,
        contactRateDelta: -0.04,
        leadRateDelta: -0.04,
        bookingRateDelta: -0.04,
      },
      safety: {
        influenceSkipRate: 0.9,
        shadowErrorRate: 0.2,
        asyncFailureRate: 0.15,
        rankingCrashCount: 2,
        malformedObservationRate: 0.2,
      },
      coverage: {
        highTrafficQueriesRepresented: false,
        lowTrafficQueriesRepresented: false,
        denseInventoryRepresented: false,
        sparseInventoryRepresented: false,
        cityZoneDiversityRepresented: false,
        priceRangeDiversityRepresented: false,
      },
    });
    expect(card.decision).toBe("not_ready");
    expect(card.totalScore).toBeLessThanOrEqual(12);
  });

  it("mixed metrics → phase_c_only band", () => {
    const card = buildRankingV8ValidationScorecard({
      quality: {
        top5OverlapRate: 0.65,
        top10OverlapRate: 0.75,
        avgRankShift: 1.8,
        meaningfulImprovementRate: 0.06,
      },
      stability: {
        repeatQueryConsistency: 0.82,
        top5ChurnRate: 0.15,
        largeRankJumpRate: 0.08,
      },
      userImpact: {
        ctrDelta: 0,
        saveRateDelta: null,
        contactRateDelta: null,
        leadRateDelta: null,
        bookingRateDelta: null,
      },
      safety: {
        influenceSkipRate: 0.2,
        shadowErrorRate: 0.01,
        asyncFailureRate: 0,
        rankingCrashCount: 0,
        malformedObservationRate: 0.02,
      },
      coverage: {
        highTrafficQueriesRepresented: true,
        lowTrafficQueriesRepresented: null,
        denseInventoryRepresented: true,
        sparseInventoryRepresented: false,
        cityZoneDiversityRepresented: null,
        priceRangeDiversityRepresented: null,
      },
    });
    expect(card.decision).toBe("phase_c_only");
    expect(card.totalScore).toBeGreaterThanOrEqual(13);
    expect(card.totalScore).toBeLessThanOrEqual(18);
  });

  it("category scores stay within 0–5", () => {
    const card = buildRankingV8ValidationScorecard(strongInputs());
    for (const c of Object.values(card.categoryScores)) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(5);
    }
  });

  it("missing user-impact metrics handled without crashing", () => {
    const inp = strongInputs();
    inp.userImpact = {
      ctrDelta: null,
      saveRateDelta: null,
      contactRateDelta: null,
      leadRateDelta: null,
      bookingRateDelta: null,
    };
    const card = buildRankingV8ValidationScorecard(inp);
    expect(card.notes.some((n) => n.includes("unavailable"))).toBe(true);
  });

  it("rollback warnings on bad overlap and safety", () => {
    const card = buildRankingV8ValidationScorecard({
      ...strongInputs(),
      quality: {
        top5OverlapRate: 0.45,
        top10OverlapRate: 0.85,
        avgRankShift: 1,
        meaningfulImprovementRate: 0.12,
      },
      safety: {
        ...strongInputs().safety,
        rankingCrashCount: 1,
      },
    });
    expect(card.warnings.some((w) => w.includes("top5_overlap"))).toBe(true);
    expect(card.warnings.some((w) => w.includes("crash"))).toBe(true);
  });

  it("does not mutate inputs", () => {
    const inp = strongInputs();
    const before = JSON.stringify(inp);
    buildRankingV8ValidationScorecard(inp);
    expect(JSON.stringify(inp)).toBe(before);
  });

  it("malformed numeric inputs treated safely", () => {
    const card = buildRankingV8ValidationScorecard({
      ...strongInputs(),
      quality: {
        top5OverlapRate: Number.NaN,
        top10OverlapRate: 0.85,
        avgRankShift: Number.POSITIVE_INFINITY,
        meaningfulImprovementRate: 0.12,
      },
    });
    expect(Number.isFinite(card.totalScore)).toBe(true);
  });

  it("zero-error safety scores strongly", () => {
    const card = buildRankingV8ValidationScorecard(strongInputs());
    expect(card.categoryScores.safety.score).toBeGreaterThan(4);
  });

  it("bridge from comparison maps agreement rates", () => {
    const cmp = baseComparison();
    const inp = buildRankingV8ValidationInputsFromComparison(cmp, { meaningfulImprovementRate: 0.1 });
    expect(inp.quality.top5OverlapRate).toBe(0.8);
    expect(inp.quality.top10OverlapRate).toBe(0.85);
  });

  it("weekly report includes key fields", () => {
    const inp = strongInputs();
    const card = buildRankingV8ValidationScorecard(inp);
    const w = buildRankingV8ValidationWeeklyReport(card, { ...inp, meta: { windowLabel: "w1" } });
    expect(w.finalScore).toBe(card.totalScore);
    expect(w.decision).toBe(card.decision);
    expect(w.categorySummary).toContain("Q=");
  });
});
