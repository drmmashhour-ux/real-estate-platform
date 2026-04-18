/**
 * Advisory recommendations only — no auto-execution language.
 */

import type {
  BNHubBookingFrictionSignal,
  BNHubGuestConversionRecommendation,
  GuestConversionFrictionContext,
} from "./guest-conversion.types";

export type RecommendationsInput = {
  context: GuestConversionFrictionContext;
  frictionSignals: BNHubBookingFrictionSignal[];
};

let _recSeq = 0;
function id(prefix: string): string {
  _recSeq += 1;
  return `${prefix}_${_recSeq}`;
}

/** Reset deterministic IDs for tests. */
export function resetGuestConversionRecommendationIdsForTests(): void {
  _recSeq = 0;
}

/**
 * Builds concise, actionable recommendations from friction + metrics (deterministic ordering).
 */
export function buildGuestConversionRecommendations(input: RecommendationsInput): BNHubGuestConversionRecommendation[] {
  const { context, frictionSignals } = input;
  const out: BNHubGuestConversionRecommendation[] = [];

  const hasFriction = (t: string) => frictionSignals.some((f) => f.title.includes(t));

  if (hasFriction("Listing page") || hasFriction("view-to-start")) {
    out.push({
      id: id("rec"),
      category: "listing_page",
      title: "Clarify title, hero photo, and key amenities",
      description:
        "Review the first screen guests see: lead photo, headline, and top amenities so intent matches search context.",
      impact: "medium",
      why: "Low starts relative to views often trace to mismatch between expectation and first impression (advisory).",
    });
  }

  if (hasFriction("Trust")) {
    out.push({
      id: id("rec"),
      category: "trust",
      title: "Increase review and verification signals",
      description:
        "Prompt completed guests to leave reviews; complete host/listing verification where available — no guarantees of ranking changes.",
      impact: "high",
      why: "Trust gaps correlate with hesitation before booking start when traffic exists.",
    });
  }

  if (hasFriction("Visual")) {
    out.push({
      id: id("rec"),
      category: "listing_page",
      title: "Add or refresh listing photos",
      description:
        "Add well-lit, wide shots of main spaces and unique features; keep order aligned with how guests scan the page.",
      impact: "high",
      why: "Thin galleries are a common click-through and confidence bottleneck (advisory).",
    });
  }

  if (hasFriction("Checkout") || hasFriction("start-to-completion")) {
    out.push({
      id: id("rec"),
      category: "booking_flow",
      title: "Review booking steps before scaling traffic",
      description:
        "Walk through dates → guests → checkout as a guest; confirm fees, policies, and errors are clear — does not change Stripe configuration.",
      impact: "high",
      why: "Starts without paid completions suggest friction late in the funnel.",
    });
  }

  const ctr = context.searchMetrics.clickThroughRate;
  if (ctr != null && ctr < 3 && (context.searchMetrics.impressions ?? 0) >= 20) {
    out.push({
      id: id("rec"),
      category: "search",
      title: "Improve discovery click-through",
      description:
        "Tune card title snippet and lead thumbnail in search/map contexts; compare with similar listings in your market (manual review).",
      impact: "medium",
      why: `CTR from discovery-context views is about ${ctr.toFixed(1)}% — may warrant creative iteration (advisory).`,
    });
  }

  if (context.reviewCount > 0 && context.nightPriceCents > 0 && (hasFriction("start-to-completion") || hasFriction("Checkout"))) {
    out.push({
      id: id("rec"),
      category: "pricing",
      title: "Review pricing competitiveness",
      description:
        "Compare nightly rate bands for comparable stays; adjustments are host decisions — this layer does not change prices.",
      impact: "medium",
      why: "When engagement exists but conversion lags, price-perceived value is a common hypothesis to test safely.",
    });
  }

  const dedup = new Map<string, BNHubGuestConversionRecommendation>();
  for (const r of out) {
    if (!dedup.has(r.title)) dedup.set(r.title, r);
  }
  return [...dedup.values()].slice(0, 8);
}
