import { ListingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { suggestDynamicPrice } from "@/modules/pricing-ai/pricing.engine";
import { buildPricingAiSignalBundle } from "@/modules/pricing-ai/signals.loader";
import { buildHostInsights } from "./insights.engine";
import { legacyPhotoUrlCount, parseAmenitiesJson, runListingOptimizer } from "./listing-optimizer";

export type HostAiPanelPayload = {
  listing: { id: string; title: string } | null;
  optimization: ReturnType<typeof runListingOptimizer> | null;
  insights: Awaited<ReturnType<typeof buildHostInsights>>;
  pricing: {
    listingId: string;
    suggestedPriceCents: number;
    currentPriceCents: number;
    currency: string;
    reasoning: string[];
  } | null;
};

/**
 * Server-side bundle for the host dashboard AI panel (read-only; no mutations).
 */
export async function loadHostAiPanel(hostId: string): Promise<HostAiPanelPayload> {
  const insights = await buildHostInsights(hostId);

  const row = await prisma.shortTermListing.findFirst({
    where: { ownerId: hostId, listingStatus: ListingStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      propertyType: true,
      beds: true,
      nightPriceCents: true,
      currency: true,
      amenities: true,
      photos: true,
      pricingMode: true,
      listingPhotos: { select: { id: true } },
    },
  });

  if (!row) {
    return { listing: null, optimization: null, insights, pricing: null };
  }

  const optimization = runListingOptimizer({
    id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    propertyType: row.propertyType,
    beds: row.beds,
    amenities: parseAmenitiesJson(row.amenities),
    structuredPhotoCount: row.listingPhotos.length,
    legacyPhotoUrlCount: legacyPhotoUrlCount(row.photos),
  });

  let pricing: HostAiPanelPayload["pricing"] = null;
  if (row.nightPriceCents > 0) {
    const listingInput = {
      id: row.id,
      nightPriceCents: row.nightPriceCents,
      city: row.city,
      beds: row.beds,
      propertyType: row.propertyType,
      pricingMode: row.pricingMode,
    };
    const signals = await buildPricingAiSignalBundle(listingInput, {});
    const suggestion = suggestDynamicPrice(listingInput, signals);
    pricing = {
      listingId: row.id,
      suggestedPriceCents: suggestion.suggestedPriceCents,
      currentPriceCents: row.nightPriceCents,
      currency: row.currency ?? "USD",
      reasoning: suggestion.reasoning,
    };
  }

  return {
    listing: { id: row.id, title: row.title },
    optimization,
    insights,
    pricing,
  };
}
