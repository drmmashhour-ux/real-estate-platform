import { describe, expect, it } from "vitest";
import { buildUserSafeExplanation } from "../recommendation-explainability";
import { inferBudgetMaxCad, type LoadedRecommendationContext } from "../recommendation-context.loader";
import { scoreFsboBuyerSync } from "../personalized-recommendations.engine";

const emptyCtx = (): LoadedRecommendationContext => ({
  userId: "u1",
  role: null,
  homeCity: null,
  personalizationEnabled: true,
  memory: {
    intentSummary: {},
    preferenceSummary: {},
    behaviorSummary: {},
    financialProfile: {},
    esgProfile: {},
    riskProfile: {},
  },
  cityWeights: {},
  propertyTypeWeights: {},
  medianViewedPriceCad: null,
  greenViewCount: 0,
  viewedFsboIds: [],
  savedFsboIds: [],
  valueAddHint: false,
});

describe("personalized recommendations", () => {
  it("cold-start explanation is user-safe", () => {
    const t = buildUserSafeExplanation({
      factors: { marketRanking: 0.8 },
      mode: "BUYER",
      coldStart: true,
    });
    expect(t.length).toBeGreaterThan(5);
  });

  it("budget inference uses median viewed when explicit max missing", () => {
    const ctx = emptyCtx();
    ctx.medianViewedPriceCad = 400_000;
    expect(inferBudgetMaxCad(ctx)).toBe(500_000);
  });

  it("opt-out / no personalization reduces city affinity contribution", () => {
    const ctx = emptyCtx();
    ctx.cityWeights["Laval"] = 10;
    const listing = {
      id: "l1",
      city: "Laval",
      propertyType: "CONDO",
      priceCents: 35_000_000,
      createdAt: new Date(),
      title: "Cozy",
      lecipmGreenVerificationLevel: null,
    };
    const withPersonal = scoreFsboBuyerSync({
      listing,
      ctx,
      personalization: true,
      marketRank01: 0.4,
    });
    const without = scoreFsboBuyerSync({
      listing,
      ctx,
      personalization: false,
      marketRank01: 0.4,
    });
    expect(withPersonal.score).toBeGreaterThan(without.score);
  });

  it("buyer vs investor explanation strings differ on factor emphasis", () => {
    const b = buildUserSafeExplanation({
      factors: { budgetFit: 0.9 },
      mode: "BUYER",
      coldStart: false,
    });
    const i = buildUserSafeExplanation({
      factors: { investorFit: 0.9 },
      mode: "INVESTOR",
      coldStart: false,
    });
    expect(b).toContain("budget");
    expect(i.toLowerCase()).toMatch(/invest/);
  });
});
