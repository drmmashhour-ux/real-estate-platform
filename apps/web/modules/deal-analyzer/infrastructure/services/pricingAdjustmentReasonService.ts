import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";

export function pricingAdjustmentReasons(args: {
  positioningOutcome: string | null;
  trustScore: number | null;
  documentCompleteness: number;
}): string[] {
  const reasons: string[] = [];
  const p = args.positioningOutcome;
  if (p === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    reasons.push("Filtered on-platform comparables suggest the ask is above similar active listings.");
  } else if (p === PricePositioningOutcome.BELOW_COMPARABLE_RANGE) {
    reasons.push("Filtered on-platform comparables suggest the ask is below similar active listings.");
  } else if (p === PricePositioningOutcome.WITHIN_COMPARABLE_RANGE) {
    reasons.push("Ask falls within a broad comparable band on this platform (not an appraisal).");
  } else {
    reasons.push("Comparable coverage is limited — price position is uncertain.");
  }
  if ((args.trustScore ?? 0) < 55) {
    reasons.push("Trust/readiness signals are soft — buyers may discount independently of list price.");
  }
  if (args.documentCompleteness < 0.7) {
    reasons.push("Required seller documents are incomplete — buyer confidence may reduce.");
  }
  return reasons;
}
