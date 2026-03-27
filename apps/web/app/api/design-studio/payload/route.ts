import { NextRequest } from "next/server";
import { getListingById } from "@/lib/bnhub/listings";
import { deriveIllustrativeListPriceUsd } from "@/modules/ai-deal-analyzer/services/map-listing-to-input";
import { generateCanvaPayload } from "@/lib/integrations/canva";

export const dynamic = "force-dynamic";

const DEMO_LISTINGS: Record<string, { title: string; city: string; country: string; address: string; nightPriceCents: number; photos: string[] }> = {
  "1": { title: "Luxury Villa", city: "Demo City", country: "US", address: "1 Villa Way", nightPriceCents: 20000, photos: [] },
  "test-listing-1": { title: "Luxury Villa", city: "Demo City", country: "US", address: "1 Villa Way", nightPriceCents: 20000, photos: [] },
  "demo-listing-montreal": {
    title: "Cozy loft in Old Montreal",
    city: "Montreal",
    country: "CA",
    address: "123 Place Jacques-Cartier",
    nightPriceCents: 12500,
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
  },
};

const MOCK_PAYLOAD = {
  title: "Luxury Villa in Montreal",
  description: "Modern luxury property with premium finishes.",
  canvaUrl: "https://www.canva.com/create/posters/",
  score: 72,
  suggestions: [
    "Add urgency words (e.g. 'Don't miss out')",
    "Include neighborhood name",
    "Use price anchoring",
  ] as string[],
};

function basicScore(title: string, description: string): number {
  let s = 50;
  if (title.length >= 30) s += 10;
  if (title.length >= 50) s += 5;
  if (description.length >= 100) s += 15;
  if (description.length >= 200) s += 10;
  if (/\d/.test(title) || /\$|€|price/i.test(description)) s += 5;
  if (/luxury|modern|stunning|beautiful/i.test(title + description)) s += 5;
  return Math.min(100, s);
}

function defaultSuggestions(score: number): string[] {
  const list: string[] = [];
  if (score < 80) list.push("Add urgency words (e.g. 'Don't miss out')");
  if (score < 85) list.push("Include neighborhood or area name");
  if (score < 90) list.push("Use price anchoring in the description");
  return list.length ? list : ["Listing looks strong. Consider A/B testing headlines."];
}

/** GET /api/design-studio/payload?listingId=... – get design payload and Canva URL for a listing. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId") ?? searchParams.get("id");
    if (!listingId) {
      return Response.json({ error: "listingId required", ...MOCK_PAYLOAD });
    }
    let listing: Awaited<ReturnType<typeof getListingById>> | null = null;
    const demo = DEMO_LISTINGS[listingId];
    if (demo) {
      listing = {
        id: listingId,
        title: demo.title,
        description: null,
        address: demo.address,
        city: demo.city,
        country: demo.country,
        nightPriceCents: demo.nightPriceCents,
        listingPhotos: [],
        photos: demo.photos,
      } as unknown as Awaited<ReturnType<typeof getListingById>>;
    } else {
      listing = await getListingById(listingId);
      if (!listing) {
        return Response.json({ ...MOCK_PAYLOAD, payload: MOCK_PAYLOAD });
      }
    }

    const currentListing = listing!;
    const legacyPhotos = Array.isArray(currentListing.photos) ? (currentListing.photos as string[]) : [];
    const galleryPhotos = Array.isArray(currentListing.listingPhotos)
      ? currentListing.listingPhotos
      : [];
    const posterInput = {
      title: currentListing.title,
      price:
        currentListing.nightPriceCents != null
          ? `€${(currentListing.nightPriceCents / 100).toFixed(0)}/night`
          : undefined,
      location:
        [currentListing.city, currentListing.country].filter(Boolean).join(", ") || currentListing.address,
      image:
        galleryPhotos[0]?.url ?? legacyPhotos[0],
      highlights: [],
    };
    const { payload, designUrl } = generateCanvaPayload(posterInput);
    const canvaUrl = designUrl;
    const title = payload.title ?? currentListing.title;
    const description =
      (payload.description ?? payload.marketingBody) ??
      `Beautiful property in ${currentListing.city ?? ""}. ${currentListing.address ?? ""}`.trim();
    const score = basicScore(title, description);
    const suggestions = defaultSuggestions(score);
    const illustrative =
      currentListing.nightPriceCents != null && currentListing.nightPriceCents > 0
        ? deriveIllustrativeListPriceUsd(currentListing.nightPriceCents)
        : null;
    return Response.json({
      payload,
      canvaUrl,
      title,
      description,
      score,
      suggestions,
      priceLabel: posterInput.price ?? null,
      illustrativePriceUsd: illustrative?.usd ?? null,
      priceIsIllustrative: illustrative != null,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ ...MOCK_PAYLOAD, payload: MOCK_PAYLOAD });
  }
}
