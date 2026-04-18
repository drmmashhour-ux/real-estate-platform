import { growthV3Flags } from "@/config/feature-flags";
import type { FsboListing } from "@prisma/client";

export type GroundedSnippet = {
  kind: "listing_summary" | "seo_meta" | "social_stub";
  text: string;
  confidence: number;
  sources: string[];
};

/**
 * Assembles copy from DB fields only — no claims beyond provided row.
 */
export function generateGroundedListingSnippets(listing: Pick<FsboListing, "title" | "city" | "priceCents" | "listingDealType">): GroundedSnippet[] {
  if (!growthV3Flags.contentEngineV1) {
    return [
      {
        kind: "listing_summary",
        text: "",
        confidence: 0,
        sources: ["FEATURE_CONTENT_ENGINE_V1 disabled"],
      },
    ];
  }

  const price = (listing.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  const summary = `${listing.title} — ${listing.city} — ${price} (${listing.listingDealType}).`;
  return [
    {
      kind: "listing_summary",
      text: summary,
      confidence: 0.95,
      sources: ["fsbo_listing.title", "fsbo_listing.city", "fsbo_listing.price_cents", "fsbo_listing.listing_deal_type"],
    },
    {
      kind: "seo_meta",
      text: `${listing.title} | ${listing.city}`,
      confidence: 0.9,
      sources: ["fsbo_listing.title", "fsbo_listing.city"],
    },
  ];
}
