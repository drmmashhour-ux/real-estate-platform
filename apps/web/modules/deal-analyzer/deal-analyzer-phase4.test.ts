import { describe, expect, it } from "vitest";
import { refreshPostBodySchema } from "@/modules/deal-analyzer/api/phase4Schemas";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { MarketConditionKind } from "@/modules/deal-analyzer/domain/negotiationPlaybooks";
import { RegionalProfileKey } from "@/modules/deal-analyzer/domain/regionalPricing";
import { classifyMarketCondition } from "@/modules/deal-analyzer/infrastructure/services/marketConditionClassifier";
import { buildNegotiationPlaybook } from "@/modules/deal-analyzer/infrastructure/services/negotiationPlaybookService";
import { classifyMarketDensity } from "@/modules/deal-analyzer/infrastructure/services/geographyNormalizationService";
import { buildRegionalPricingRules } from "@/modules/deal-analyzer/infrastructure/services/regionalPricingRulesService";
import {
  hoursBetween,
  needsRefreshDueToStaleness,
  priceChangeExceedsThreshold,
} from "@/modules/deal-analyzer/infrastructure/services/staleAnalysisService";
import { mapNegotiationPlaybookRow, mapRepricingReviewRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";
import type { DealNegotiationPlaybook, SellerRepricingReview } from "@prisma/client";

describe("deal-analyzer phase 4 refresh evaluation", () => {
  it("staleness detects listing newer than last refresh", () => {
    const listingUpdatedAt = new Date("2025-01-10T12:00:00Z");
    const analysisUpdatedAt = new Date("2025-01-01T12:00:00Z");
    const lastComparableRefreshAt = new Date("2025-01-05T12:00:00Z");
    expect(
      needsRefreshDueToStaleness({
        listingUpdatedAt,
        analysisUpdatedAt,
        lastComparableRefreshAt,
      }),
    ).toBe(true);
  });

  it("price change threshold is deterministic", () => {
    expect(priceChangeExceedsThreshold(500_000_00, 515_000_00, 0.02)).toBe(true);
    expect(priceChangeExceedsThreshold(500_000_00, 505_000_00, 0.02)).toBe(false);
  });

  it("hoursBetween is symmetric", () => {
    const a = new Date("2025-01-10T12:00:00Z");
    const b = new Date("2025-01-12T12:00:00Z");
    expect(hoursBetween(a, b)).toBe(48);
  });
});

describe("deal-analyzer phase 4 regional pricing", () => {
  it("dense urban profile uses tighter radius than sparse", () => {
    const dense = buildRegionalPricingRules(RegionalProfileKey.DENSE_URBAN, "Toronto, ON");
    const sparse = buildRegionalPricingRules(RegionalProfileKey.SPARSE, "Remote, QC");
    expect(dense.comparableSearchOverrides.maxRadiusKm!).toBeLessThan(sparse.comparableSearchOverrides.maxRadiusKm!);
    expect(dense.reasons.length).toBeGreaterThan(0);
    expect(sparse.dataSparsityPenalty).toBeGreaterThan(dense.dataSparsityPenalty);
  });

  it("classifyMarketDensity picks dense for major city names", () => {
    expect(classifyMarketDensity("Toronto", 5)).toBe(RegionalProfileKey.DENSE_URBAN);
  });

  it("very low listing count yields sparse profile", () => {
    expect(classifyMarketDensity("Smalltownville", 3)).toBe(RegionalProfileKey.SPARSE);
  });
});

describe("deal-analyzer phase 4 market condition + playbooks", () => {
  it("insufficient comparable data yields uncertain", () => {
    const mc = classifyMarketCondition({
      positioningOutcome: PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA,
      confidenceLevel: "high",
      comparableCount: 10,
      listingAgeDays: 10,
    });
    expect(mc).toBe(MarketConditionKind.UNCERTAIN);
  });

  it("seller_favorable vs buyer_favorable produce different first steps", () => {
    const seller = buildNegotiationPlaybook({
      marketCondition: MarketConditionKind.SELLER_FAVORABLE,
      posture: "assertive",
      trustScore: 70,
    });
    const buyer = buildNegotiationPlaybook({
      marketCondition: MarketConditionKind.BUYER_FAVORABLE,
      posture: "balanced",
      trustScore: 70,
    });
    expect(seller.steps[0].step).not.toBe(buyer.steps[0].step);
  });

  it("uncertain market lowers confidence vs balanced with good trust", () => {
    const uncertain = buildNegotiationPlaybook({
      marketCondition: MarketConditionKind.UNCERTAIN,
      posture: "balanced",
      trustScore: 70,
    });
    const balanced = buildNegotiationPlaybook({
      marketCondition: MarketConditionKind.BALANCED,
      posture: "balanced",
      trustScore: 70,
    });
    expect(uncertain.confidenceLevel).toBe("low");
    expect(balanced.confidenceLevel).not.toBe("low");
  });

  it("weak trust forces extra warnings", () => {
    const lowTrust = buildNegotiationPlaybook({
      marketCondition: MarketConditionKind.BALANCED,
      posture: "balanced",
      trustScore: 20,
    });
    expect(lowTrust.confidenceLevel).toBe("low");
    expect(lowTrust.warnings.some((w) => /trust|readiness/i.test(w))).toBe(true);
  });
});

describe("deal-analyzer phase 4 DTO mappers + schemas", () => {
  it("refresh body schema accepts optional force", () => {
    expect(refreshPostBodySchema.parse({})).toEqual({});
    expect(refreshPostBodySchema.parse({ force: true })).toEqual({ force: true });
  });

  it("negotiation playbook row maps stable shape", () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      propertyId: "550e8400-e29b-41d4-a716-446655440001",
      analysisId: null,
      offerStrategyId: null,
      marketCondition: "balanced",
      posture: "cautious",
      playbookSteps: [{ step: "A", rationale: "B" }],
      warnings: ["w"],
      confidenceLevel: "medium",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    } as DealNegotiationPlaybook;
    const dto = mapNegotiationPlaybookRow(row);
    expect(dto.marketCondition).toBe("balanced");
    expect(dto.playbookSteps).toHaveLength(1);
    expect(dto.updatedAt).toMatch(/^\d{4}/);
  });

  it("repricing review maps reasons array", () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      propertyId: "550e8400-e29b-41d4-a716-446655440003",
      currentPriceCents: 400_000_00,
      currentPosition: "above_median_band",
      suggestedAction: "review_ask",
      confidenceLevel: "medium",
      reasons: ["r1"],
      explanation: "x",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SellerRepricingReview;
    const dto = mapRepricingReviewRow(row);
    expect(dto.reasons).toEqual(["r1"]);
    expect(dto.currentPriceCents).toBe(400_000_00);
  });
});
