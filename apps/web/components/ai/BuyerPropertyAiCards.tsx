"use client";

import type { BuyerListingPayload } from "@/components/listings/BuyerListingDetail";
import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

/** Embedded Buyer Hub AI — uses `/api/ai/platform` (sign-in required). */
export function BuyerPropertyAiCards({ listing }: { listing: BuyerListingPayload }) {
  const ctx = {
    listingId: listing.id,
    listingKind: listing.listingKind ?? "fsbo",
    title: listing.title,
    city: listing.city,
    priceCents: listing.priceCents,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    surfaceSqft: listing.surfaceSqft,
    annualTaxesCents: listing.annualTaxesCents,
    condoFeesCents: listing.condoFeesCents,
    propertyType: listing.propertyType,
    descriptionExcerpt: listing.description.slice(0, 2500),
  };

  return (
    <div className="space-y-4">
      <HubAiInsightWidget
        hub="buyer"
        feature="listing_insight"
        intent="analyze"
        title="Property insight"
        context={ctx}
        accent="var(--color-premium-gold)"
      />
      <HubAiInsightWidget
        hub="buyer"
        feature="costs_warnings"
        intent="summary"
        title="Costs & warnings"
        context={ctx}
        accent="var(--color-premium-gold)"
      />
    </div>
  );
}
