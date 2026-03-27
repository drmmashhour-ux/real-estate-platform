import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";

export function pricingPositionDrift(
  prevOutcome: string | null | undefined,
  nextOutcome: string | null | undefined,
): "improved_for_buyer" | "improved_for_seller" | "neutral" | "unknown" {
  if (!prevOutcome || !nextOutcome) return "unknown";
  if (prevOutcome === nextOutcome) return "neutral";
  if (prevOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE && nextOutcome !== PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    return "improved_for_buyer";
  }
  if (prevOutcome !== PricePositioningOutcome.ABOVE_COMPARABLE_RANGE && nextOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    return "improved_for_seller";
  }
  return "neutral";
}
