import { revenueV4Flags } from "@/config/feature-flags";
import type { ProposedListingAutopilotAction } from "@/src/modules/autopilot/actions/listing.actions";
import { detectFsboRevenueOpportunities } from "@/src/modules/revenue/opportunities/revenue-opportunity.service";
import { recommendFsboListingPrice } from "@/src/modules/pricing/pricing.engine";

/**
 * Maps Revenue Engine v4 signals to core autopilot actions — all require human/owner approval by default.
 */
export async function proposeRevenueEngineAutopilotActions(listingId: string): Promise<ProposedListingAutopilotAction[]> {
  if (!revenueV4Flags.revenueEngineV1 && !revenueV4Flags.pricingEngineV1) return [];

  const [opps, price] = await Promise.all([
    revenueV4Flags.revenueEngineV1 ? detectFsboRevenueOpportunities(listingId) : Promise.resolve([]),
    revenueV4Flags.pricingEngineV1 ? recommendFsboListingPrice(listingId) : Promise.resolve(null),
  ]);

  const out: ProposedListingAutopilotAction[] = [];

  for (const o of opps) {
    const base = {
      domain: "listing" as const,
      payload: {
        listingId,
        opportunityType: o.type,
        revenueOpportunity: o,
        pricingHint: price
          ? {
              recommendedPriceCents: price.recommendedPriceCents,
              confidence: price.confidence,
              strategy: price.strategy,
            }
          : null,
      },
    };

    if (o.type === "underpriced_vs_peers") {
      out.push({
        ...base,
        type: "suggest_price_increase",
        severity: "info",
        riskLevel: o.riskLevel,
        title: "Price may be below peer median",
        description: o.explanation.join(" "),
      });
    } else if (o.type === "overpriced_vs_peers") {
      out.push({
        ...base,
        type: "suggest_price_decrease",
        severity: "info",
        riskLevel: o.riskLevel,
        title: "Price may be above peer median",
        description: o.explanation.join(" "),
      });
    } else if (o.type === "high_traffic_low_conversion") {
      out.push({
        ...base,
        type: "improve_conversion",
        severity: "warning",
        riskLevel: "medium",
        title: "Strong traffic, weak conversion",
        description: o.explanation.join(" "),
      });
    } else if (o.type === "stale_listing_monetization") {
      out.push({
        ...base,
        type: "suggest_promotional_discount",
        severity: "info",
        riskLevel: "low",
        title: "Stale listing — optional promotional test",
        description: o.explanation.join(" "),
      });
    } else if (o.type === "paid_not_featured") {
      out.push({
        ...base,
        type: "suggest_upgrade_to_featured",
        severity: "info",
        riskLevel: "low",
        title: "Featured upgrade candidate",
        description: o.explanation.join(" "),
      });
    }
  }

  if (revenueV4Flags.pricingEngineV1 && price && out.length === 0) {
    out.push({
      type: "suggest_price_review",
      domain: "listing",
      severity: "info",
      riskLevel: "low",
      title: "Pricing recommendation available",
      description: price.reasoning.slice(0, 2).join(" ") || "Review heuristic price band.",
      payload: { listingId, pricing: price },
    });
  }

  return out;
}
