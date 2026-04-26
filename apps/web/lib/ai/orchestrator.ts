import { validateListing } from "@/lib/compliance/checks";
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
  if (bnhId) {
    const price = await getDynamicPrice(bnhId);
    const currentNight =
      typeof listing.nightPriceCents === "number" && listing.nightPriceCents > 0
        ? listing.nightPriceCents / 100
        : typeof listing.price === "number" && listing.price > 0
          ? listing.price
          : null;
    if (price != null && currentNight != null && Math.abs(price - currentNight) > 0.01) {
      actions.push({
        type: "price_update",
        newPrice: price,
      });
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
}

export type { AutonomousAction } from "./executor";
