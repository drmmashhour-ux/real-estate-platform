import { growthV3Flags } from "@/config/feature-flags";
import type { FsboListing } from "@prisma/client";

export type ZeroClickBlock = {
  faq: { question: string; answer: string }[];
  jsonLd: Record<string, unknown>;
  confidence: number;
  sources: string[];
};

/**
 * FAQ + JSON-LD from listing fields only (FAQPage / Product-style hints). No invented amenities.
 */
export function buildZeroClickBlocksFromListing(
  listing: Pick<FsboListing, "title" | "city" | "priceCents" | "listingDealType" | "bedrooms" | "propertyType">,
): ZeroClickBlock | null {
  if (!growthV3Flags.seoAutopilotV3) return null;

  const price = (listing.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  const beds = listing.bedrooms != null ? String(listing.bedrooms) : "Not specified";
  const pt = listing.propertyType ?? "Property";

  const faq = [
    {
      question: `What is the list price for ${listing.title}?`,
      answer: `The list price is ${price} (${listing.listingDealType}).`,
    },
    {
      question: `Where is this ${pt.toLowerCase()} located?`,
      answer: `The listing is in ${listing.city}.`,
    },
    {
      question: "How many bedrooms does the listing show?",
      answer: `Bedrooms on file: ${beds}.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return {
    faq,
    jsonLd,
    confidence: 0.9,
    sources: ["fsbo_listing.price_cents", "fsbo_listing.city", "fsbo_listing.title", "fsbo_listing.bedrooms"],
  };
}
