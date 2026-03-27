import { describe, expect, it } from "vitest";
import { buildOfferStrategySnapshot } from "@/modules/deal-analyzer/infrastructure/services/offerStrategyService";
import { OfferPosture } from "@/modules/deal-analyzer/domain/offerStrategy";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { analyzeMortgageAffordability } from "@/modules/deal-analyzer/infrastructure/services/mortgageAffordabilityService";
import { estimateMonthlyPaymentCents } from "@/modules/deal-analyzer/infrastructure/services/paymentEstimator";
import { buildSellerPricingAdvice } from "@/modules/deal-analyzer/infrastructure/services/sellerPricingAdvisorService";
import { SellerPricePosition } from "@/modules/deal-analyzer/domain/pricingAdvisor";
import { getStrategyWeights } from "@/modules/deal-analyzer/infrastructure/services/strategyModeService";
import { UserStrategyMode } from "@/modules/deal-analyzer/domain/strategyModes";
import { buildSafeRecommendedConditions } from "@/modules/deal-analyzer/infrastructure/services/conditionRecommendationService";
import { runAffordabilityBodySchema, runOfferStrategyBodySchema } from "@/modules/deal-analyzer/api/phase3Schemas";

describe("deal-analyzer phase 3 offer strategy", () => {
  it("weak trust forces cautious posture", () => {
    const out = buildOfferStrategySnapshot({
      askCents: 500_000_00,
      trustScore: 30,
      riskScore: 40,
      positioningOutcome: PricePositioningOutcome.WITHIN_COMPARABLE_RANGE,
      comparablesSummaryConfidence: "high",
      strategyMode: null,
    });
    expect(out.offerPosture).toBe(OfferPosture.CAUTIOUS);
  });

  it("weak comps reduce confidence", () => {
    const out = buildOfferStrategySnapshot({
      askCents: 500_000_00,
      trustScore: 70,
      riskScore: 30,
      positioningOutcome: PricePositioningOutcome.WITHIN_COMPARABLE_RANGE,
      comparablesSummaryConfidence: "low",
      strategyMode: null,
    });
    expect(out.confidenceLevel).toBe("low");
  });

  it("recommended conditions stay in safe categories", () => {
    const rows = buildSafeRecommendedConditions({ posture: "balanced" });
    const cats = new Set(rows.map((r) => r.category));
    expect(cats.has("financing")).toBe(true);
    expect(cats.has("inspection")).toBe(true);
    expect(rows.every((r) => r.label.length > 0)).toBe(true);
  });
});

describe("deal-analyzer phase 3 affordability", () => {
  it("monthly payment estimation is deterministic", () => {
    const p = estimateMonthlyPaymentCents({
      principalCents: 400_000_00,
      annualRate: 0.06,
      termYears: 25,
    });
    expect(p).not.toBeNull();
    expect(p! > 0).toBe(true);
  });

  it("missing income lowers confidence", () => {
    const out = analyzeMortgageAffordability({
      listPriceCents: 500_000_00,
      downPaymentCents: 100_000_00,
      annualRate: 0.065,
      termYears: 25,
      monthlyIncomeCents: null,
      monthlyDebtsCents: null,
    });
    expect(out.confidenceLevel).toBe("low");
  });

  it("uses conservative disclaimer language (not a guarantee of approval)", () => {
    const out = analyzeMortgageAffordability({
      listPriceCents: 500_000_00,
      downPaymentCents: 100_000_00,
      annualRate: 0.065,
      termYears: 25,
      monthlyIncomeCents: 20_000_00,
      monthlyDebtsCents: 0,
    });
    const joined = out.warnings.join(" ").toLowerCase();
    expect(joined).toContain("not a mortgage");
    expect(joined).not.toContain("fully approved");
    expect(joined).not.toContain("you are approved");
  });

  it("computes affordability level when income is present", () => {
    const out = analyzeMortgageAffordability({
      listPriceCents: 500_000_00,
      downPaymentCents: 50_000_00,
      annualRate: 0.065,
      termYears: 25,
      monthlyIncomeCents: 8_000_00,
      monthlyDebtsCents: 5_000_00,
    });
    expect(out.affordabilityLevel).toBeTruthy();
    expect(out.estimatedMonthlyPaymentCents).not.toBeNull();
  });
});

describe("deal-analyzer phase 3 seller pricing advisor", () => {
  it("classifies competitively when within range", () => {
    const out = buildSellerPricingAdvice({
      positioningOutcome: PricePositioningOutcome.WITHIN_COMPARABLE_RANGE,
      compConfidence: "high",
      trustScore: 70,
      documentCompleteness: 0.9,
      askCents: 500_000_00,
      medianPriceCents: 495_000_00,
    });
    expect(out.pricePosition).toBe(SellerPricePosition.COMPETITIVELY_POSITIONED);
  });

  it("incomplete listing shifts toward trust improvement action", () => {
    const out = buildSellerPricingAdvice({
      positioningOutcome: PricePositioningOutcome.WITHIN_COMPARABLE_RANGE,
      compConfidence: "high",
      trustScore: 30,
      documentCompleteness: 0.2,
      askCents: 500_000_00,
      medianPriceCents: 500_000_00,
    });
    expect(out.explanation.toLowerCase()).toContain("not an appraisal");
    expect(out.suggestedAction.length).toBeGreaterThan(0);
  });
});

describe("deal-analyzer phase 3 strategy modes", () => {
  it("buy_to_rent weights cash flow more than buy_to_flip", () => {
    const rent = getStrategyWeights(UserStrategyMode.BUY_TO_RENT);
    const flip = getStrategyWeights(UserStrategyMode.BUY_TO_FLIP);
    expect(rent.cashFlow).toBeGreaterThan(flip.cashFlow);
    expect(flip.pricePosition).toBeGreaterThan(rent.pricePosition);
    expect(flip.risk).toBeGreaterThan(rent.risk);
  });
});

describe("deal-analyzer phase 3 zod", () => {
  it("validates affordability body", () => {
    const ok = runAffordabilityBodySchema.safeParse({
      downPaymentCents: 1000,
      annualRate: 0.05,
      termYears: 25,
      monthlyIncomeCents: 5000_00,
    });
    expect(ok.success).toBe(true);
  });

  it("validates offer strategy body", () => {
    const ok = runOfferStrategyBodySchema.safeParse({ strategyMode: "buy_to_flip" });
    expect(ok.success).toBe(true);
  });
});

