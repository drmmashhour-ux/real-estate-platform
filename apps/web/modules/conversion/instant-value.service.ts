import type {
  BuildInstantValueInput,
  InstantValueInsight,
  InstantValueIntent,
  InstantValueSummary,
} from "@/modules/conversion/instant-value.types";

function id(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

function baseTrustLines(): string[] {
  return ["Secure platform", "Verified listings where marked", "No hidden platform fees on browse"];
}

function intentHeadline(intent: InstantValueIntent, page: BuildInstantValueInput["page"]): { h: string; s: string; cta: string } {
  switch (intent) {
    case "rent":
      return {
        h: "Find a rental that fits your timeline",
        s: "Filter by city and budget — long-term rentals and stays in one place.",
        cta: "Explore rentals",
      };
    case "invest":
      return {
        h: "Spot investment-ready opportunities faster",
        s: "Listings, analysis tools, and BNHub revenue paths — you choose the lane.",
        cta: "See opportunities",
      };
    case "host":
      return {
        h: "Monetize your property with BNHub",
        s: "Short-term stays with Stripe-backed checkout when enabled in your market.",
        cta: "Open host tools",
      };
    case "buy":
    default:
      if (page === "leads") {
        return {
          h: "Get matched to serious opportunities",
          s: "One intake — we route you to verified inventory and brokers when relevant.",
          cta: "Submit intake",
        };
      }
      if (page === "listings") {
        return {
          h: "Browse recommended inventory",
          s: "Map + list — same filters as the Buy hub; prices shown where published.",
          cta: "Refine search",
        };
      }
      if (page === "property") {
        return {
          h: "Evaluate this property with context",
          s: "Price, location, and representative contact — no fabricated market claims.",
          cta: "Contact listing",
        };
      }
      if (page === "broker_preview") {
        return {
          h: "See the quality of demand we route",
          s: "Intent, geography, and budget signals — pay per lead when you unlock.",
          cta: "Start receiving leads",
        };
      }
      return {
        h: "Québec real estate, one platform",
        s: "Stays, homes, and investments — search, compare, and act with clear pricing where shown.",
        cta: "Start exploring",
      };
  }
}

function insightsFor(
  input: BuildInstantValueInput,
  intent: InstantValueIntent,
): InstantValueInsight[] {
  const insights: InstantValueInsight[] = [];
  let n = 0;

  if (input.trustSignals?.platformSecureCheckout !== false) {
    insights.push({
      id: id("trust", n++),
      title: "Secure checkout where payments apply",
      description: "BNHub and select flows use Stripe — no card handling in chat.",
      category: "trust",
      confidence: "high",
    });
  }

  if (input.listing?.verified) {
    insights.push({
      id: id("v", n++),
      title: "Verified listing",
      description: "This seller or broker path passed platform verification where shown.",
      category: "trust",
      confidence: "high",
    });
  } else if (input.page === "property" || input.page === "listings") {
    insights.push({
      id: id("v", n++),
      title: "Transparent pricing where published",
      description: "We show list price and facts from the listing record — not estimates.",
      category: "pricing",
      confidence: "medium",
    });
  }

  if (input.listing?.city) {
    insights.push({
      id: id("loc", n++),
      title: `Market: ${input.listing.city}`,
      description: "Use filters and map to compare nearby inventory.",
      category: "demand",
      confidence: "medium",
    });
  }

  if (input.listingsContext?.resultCount != null && input.listingsContext.resultCount >= 0) {
    insights.push({
      id: id("cnt", n++),
      title: `${input.listingsContext.resultCount} listing${input.listingsContext.resultCount === 1 ? "" : "s"} in this view`,
      description: "Counts reflect your current filters — adjust to widen or narrow.",
      category: "opportunity",
      confidence: "high",
    });
  }

  if (input.listing?.featured) {
    insights.push({
      id: id("feat", n++),
      title: "Featured visibility",
      description: "This listing has enhanced placement while the feature is active.",
      category: "opportunity",
      confidence: "medium",
    });
  }

  if (intent === "invest") {
    insights.push({
      id: id("inv", n++),
      title: "Investment tooling",
      description: "Portfolio and evaluation flows connect from the investor hub when enabled.",
      category: "opportunity",
      confidence: "low",
    });
  }

  if (insights.length < 2) {
    insights.push({
      id: id("pad", n++),
      title: "AI-assisted matching",
      description: "Recommendations rank using on-platform signals — not paid payola for placement.",
      category: "opportunity",
      confidence: "low",
    });
  }

  return insights.slice(0, 4);
}

/**
 * Deterministic copy from optional inputs only — never fabricates prices or demand scores.
 */
export function buildInstantValueSummary(input: BuildInstantValueInput): InstantValueSummary {
  const intent: InstantValueIntent = input.intent ?? "buy";
  const { h, s, cta } = intentHeadline(intent, input.page);

  return {
    intent,
    headline: h,
    subheadline: s,
    insights: insightsFor(input, intent),
    ctaLabel: cta,
    trustLines: baseTrustLines(),
  };
}
