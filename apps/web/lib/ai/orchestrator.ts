import { trackRevenueEvent } from "@/lib/analytics/revenue";
import { validateListing } from "@/lib/compliance/checks";
import { isAiPricingEnabled } from "@/lib/config/ops-flags";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { logAiError } from "@/lib/observability/structured-log";
import { optimizePriceForRevenue } from "@/lib/ai/priceOptimizer";
import { getDynamicPrice } from "@/lib/services/pricingEngine";
import type { ListingAgentInput } from "./listingAgent";
import { analyzeListing } from "./listingAgent";
import type { AutonomousAction } from "./executor";

/**
 * Full payload for the autonomous run: marketplace listing JSON + optional CRM/BNHub ids
 * (single `id` is usually the marketplace / primary row).
 */
export type AutonomousAgentListing = ListingAgentInput & {
  id: string;
  /** Monolith CRM `Listing.id` for OACIQ `validateListing` + compliance hold. */
  crmListingId?: string | null;
  /** BNHub `ShortTermListing.id` for `getDynamicPrice` (not the same as CRM `Listing.id`). */
  shortTermListingId?: string | null;
  nightPriceCents?: number | null;
};

/**
 * Fuses listing QA, dynamic nightly pricing (BNHub), and OACIQ compliance checks.
 */
export async function runAutonomousAgent(
  listing: AutonomousAgentListing
): Promise<AutonomousAction[]> {
  if (isDemoMode) {
    return [];
  }
  try {
  const actions: AutonomousAction[] = [];

  const analysis = analyzeListing(listing);
  if (analysis.score < 80) {
    actions.push({
      type: "listing_improvement",
      issues: analysis.issues,
      actions: analysis.actions,
    });
  }

  const bnhId =
    typeof listing.shortTermListingId === "string" && listing.shortTermListingId.trim()
      ? listing.shortTermListingId.trim()
      : null;
  if (bnhId && isAiPricingEnabled()) {
    const currentNight =
      typeof listing.nightPriceCents === "number" && listing.nightPriceCents > 0
        ? listing.nightPriceCents / 100
        : typeof listing.price === "number" && listing.price > 0
          ? listing.price
          : null;
    const views = typeof listing.views === "number" && listing.views > 0 ? listing.views : 0;
    const bookings = typeof listing.bookings === "number" && listing.bookings >= 0 ? listing.bookings : 0;
    const conversionRate = views > 0 ? bookings / views : 0.01;

    if (currentNight != null) {
      const revenuePick = optimizePriceForRevenue(currentNight, conversionRate);
      if (revenuePick != null) {
        const { price: bestPrice } = revenuePick;
        const changePct = (bestPrice - currentNight) / currentNight;
        actions.push({
          type: "price_update",
          newPrice: bestPrice,
          changePct,
          source: "revenue_optimizer",
        });
        trackRevenueEvent({
          listingId: listing.id,
          price: bestPrice,
          conversionRate: revenuePick.conversionRate,
        });
      } else {
        const price = await getDynamicPrice(bnhId);
        if (price != null && Math.abs(price - currentNight) > 0.01) {
          actions.push({
            type: "price_update",
            newPrice: price,
            source: "dynamic_pricing",
          });
        }
      }
    }
  }

  const complianceId =
    (typeof listing.crmListingId === "string" && listing.crmListingId.trim()
      ? listing.crmListingId
      : null) ?? listing.id;

  try {
    await validateListing(complianceId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    actions.push({
      type: "compliance_block",
      message,
    });
  }

  return actions;
  } catch (e) {
    logAiError("runAutonomousAgent", e, { listingId: listing.id });
    return [];
  }
}

export type { AutonomousAction } from "./executor";
