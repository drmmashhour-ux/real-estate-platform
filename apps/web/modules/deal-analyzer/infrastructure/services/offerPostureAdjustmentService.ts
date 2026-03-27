import { OfferPosture } from "@/modules/deal-analyzer/domain/offerStrategy";
import { MarketConditionKind } from "@/modules/deal-analyzer/domain/negotiationPlaybooks";

/** Adjusts posture label for playbook display — does not change deterministic offer bands. */
export function adjustPostureForMarketCondition(
  basePosture: string,
  marketCondition: MarketConditionKind,
  trustScore: number | null,
): string {
  const t = trustScore ?? 0;
  if (t < 45) return OfferPosture.CAUTIOUS;
  if (marketCondition === MarketConditionKind.UNCERTAIN) return OfferPosture.CAUTIOUS;
  if (marketCondition === MarketConditionKind.SELLER_FAVORABLE && basePosture === OfferPosture.AGGRESSIVE) {
    return OfferPosture.BALANCED;
  }
  if (marketCondition === MarketConditionKind.BUYER_FAVORABLE && basePosture === OfferPosture.BALANCED) {
    return OfferPosture.BALANCED;
  }
  return basePosture;
}
