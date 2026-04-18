import { STALE_LISTING_DAYS } from "@/src/modules/revenue/revenue.constants";
import type { FsboPricingSignals } from "./pricing.signals";
import type { PricingRecommendation, PricingStrategy } from "./pricing.model";
import { expectedImpactTemplate, labelForStrategy } from "./pricing.explainer";

function daysSince(d: Date): number {
  return (Date.now() - d.getTime()) / 86400000;
}

/**
 * Heuristic FSBO list price recommendation — requires peer median for medium+ confidence.
 */
export function optimizeFsboListPrice(signals: FsboPricingSignals): PricingRecommendation {
  const reasoning: string[] = [];
  let strategy: PricingStrategy = "competitive";
  let mult = 1;
  const stale = daysSince(signals.updatedAt) > STALE_LISTING_DAYS;

  if (signals.medianPeerPriceCents && signals.medianPeerPriceCents > 0) {
    const ratio = signals.priceCents / signals.medianPeerPriceCents;
    reasoning.push(`Peer median ≈ ${(signals.medianPeerPriceCents / 100).toFixed(0)} (${signals.peerSampleSize} listings).`);
    reasoning.push(`Current / median ratio = ${ratio.toFixed(2)}.`);

    if (ratio < 0.88) {
      strategy = "demand_based";
      mult = 1.03;
      reasoning.push("Listed below peer cluster — small upward test may be appropriate if demand is strong.");
    } else if (ratio > 1.18) {
      strategy = stale ? "stale_discount" : "competitive";
      mult = stale ? 0.94 : 0.97;
      reasoning.push(stale ? "Above peers and stale — consider bounded decrease." : "Above peers — consider aligning closer to median.");
    } else {
      reasoning.push("Near peer band — maintain or micro-tune.");
    }
  } else {
    reasoning.push(`Insufficient comparable volume (peers=${signals.peerSampleSize}) — wide band; low confidence.`);
  }

  if (signals.viewCount > 60 && signals.leadCount === 0) {
    strategy = stale ? "stale_discount" : "demand_based";
    mult *= stale ? 0.96 : 0.98;
    reasoning.push("High views, zero leads — conversion friction; price/trust review.");
  }

  if (signals.trustScore != null && signals.trustScore > 78) {
    mult *= 1.01;
    strategy = "premium_quality";
    reasoning.push("Strong trust_score — tiny premium factor within band.");
  }

  const recommended = Math.round(signals.priceCents * mult);
  const band = Math.max(5000, Math.round(signals.priceCents * 0.04));
  const min = Math.max(1000, recommended - band);
  const max = recommended + band;

  const hasMedian = signals.medianPeerPriceCents != null && signals.peerSampleSize >= 6;
  const confidence = hasMedian ? Math.min(0.85, 0.45 + signals.peerSampleSize / 400) : 0.28;
  const confidenceLabel = confidence >= 0.65 ? "high" : confidence >= 0.45 ? "medium" : "low";
  const lowConfidence = !hasMedian;
  const marketMedian =
    signals.medianPeerPriceCents != null && signals.medianPeerPriceCents > 0
      ? signals.medianPeerPriceCents / 100
      : null;

  reasoning.push(labelForStrategy(strategy));

  return {
    recommendedPriceCents: recommended,
    priceRangeCents: { min, max },
    confidence,
    confidenceLabel,
    reasoning,
    expectedImpact: expectedImpactTemplate(strategy, "±0–4% vs current list over 30–60d (illustrative)"),
    strategy,
    dataQualityNote: hasMedian ? undefined : "Low confidence: expand comparable set or order valuation.",
    marketMedian,
    marketSampleSize: signals.peerSampleSize,
    lowConfidence,
  };
}
