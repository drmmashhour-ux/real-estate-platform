import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { MarketConditionKind } from "@/modules/deal-analyzer/domain/negotiationPlaybooks";

export function classifyMarketCondition(args: {
  positioningOutcome: string | null;
  confidenceLevel: string | null;
  comparableCount: number;
  listingAgeDays: number;
}): MarketConditionKind {
  const minSeller = dealAnalyzerConfig.phase4.marketCondition.sellerFavorableMinComps;
  const staleDays = dealAnalyzerConfig.phase4.marketCondition.staleListingDays;

  if (!args.positioningOutcome || args.positioningOutcome === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA) {
    return MarketConditionKind.UNCERTAIN;
  }
  if (args.confidenceLevel === "low" || args.comparableCount < dealAnalyzerConfig.comparable.minGoodComps) {
    return MarketConditionKind.UNCERTAIN;
  }

  if (args.listingAgeDays >= staleDays && args.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    return MarketConditionKind.BUYER_FAVORABLE;
  }

  if (args.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE && args.comparableCount >= minSeller) {
    return MarketConditionKind.SELLER_FAVORABLE;
  }
  if (args.positioningOutcome === PricePositioningOutcome.BELOW_COMPARABLE_RANGE) {
    return MarketConditionKind.BUYER_FAVORABLE;
  }
  return MarketConditionKind.BALANCED;
}
