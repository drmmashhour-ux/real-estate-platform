import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { RepricingTriggerType } from "@/modules/deal-analyzer/domain/repricing";

export function repricingTriggerExplanation(type: string): string {
  switch (type) {
    case RepricingTriggerType.MOVED_ABOVE_COMPARABLE_RANGE:
      return "On-platform comparables suggest the list price moved above similar active listings — review positioning.";
    case RepricingTriggerType.COMP_CONFIDENCE_IMPROVED:
      return "Comparable confidence improved — revisit whether price still aligns with the tighter band.";
    case RepricingTriggerType.TRUST_IMPROVED_PRICE_STILL_HIGH:
      return "Trust/readiness improved, but price still looks elevated vs comparables — consider evidence before changing price.";
    case RepricingTriggerType.CONFIDENCE_DROPPED_MARKET_DATA:
      return "Market-data confidence dropped — gather fresh comparables before large price moves.";
    case RepricingTriggerType.STALE_WEAK_POSITION:
      return "Listing has been static a while with a weak price position — review freshness and evidence.";
    case RepricingTriggerType.DOCS_COMPLETED_REVIEW_PRICE:
      return "Key documents are in better shape — a pricing review may be timely (not a price instruction).";
    default:
      return dealAnalyzerConfig.phase4.disclaimers.repricing;
  }
}
