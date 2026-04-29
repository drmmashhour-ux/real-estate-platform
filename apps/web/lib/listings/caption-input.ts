/**
 * Safe public-ish facts for caption generation — no street address, names, phones, or emails.
 */

export type CaptionListingKind = "sale" | "stay";

export type CaptionSafeInput = {
  title: string;
  city: string;
  /** Region / borough — optional neighborhood signal without a street address */
  neighborhood?: string;
  /** Normalized coarse type for copy */
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  /** Guests / occupants hint when relevant (short-term); omitted when unknown */
  capacity?: number;
  surfaceSqft?: number;
  yearBuilt?: number;
  keyAmenities: string[];
  highlights: string[];
  listingKind: CaptionListingKind;
};

function parseStringArrayJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
}

/** Map hub tokens to short amenity keys for prompts */
function normalizeAmenityToken(token: string): string | null {
  const t = token.toLowerCase().replace(/\s+/g, "_");
  const synonyms: Record<string, string> = {
    airport_pickup: "transport_help",
    parking: "parking",
    wifi: "wifi",
    internet: "wifi",
    ac: "ac",
    air_conditioning: "ac",
    pool: "pool",
    gym: "gym",
    elevator: "elevator",
    waterfront: "waterfront",
    fireplace: "fireplace",
    garage: "garage",
    storage: "storage",
    balcony: "balcony",
    terrace: "terrace",
    hardwood: "hardwood_floors",
    renovated: "renovated",
  };
  return synonyms[t] ?? (t.length <= 32 ? t : null);
}

function normalizeHighlightToken(token: string): string | null {
  const t = token.toLowerCase().replace(/\s+/g, "_");
  const synonyms: Record<string, string> = {
    downtown: "downtown",
    waterfront: "waterfront",
    near_attractions: "near_attractions",
    near_transit: "near_transit",
    quiet: "quiet_area",
    family_friendly: "family_friendly",
    parks_nearby: "near_parks",
  };
  return synonyms[t] ?? (t.length <= 48 ? t.replace(/_/g, " ") : null);
}

export type ListingLikeForCaption = {
  title: string;
  city: string;
  region?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surfaceSqft?: number | null;
  yearBuilt?: number | null;
  experienceTags?: unknown;
  servicesOffered?: unknown;
  listingDealType?: string | null;
};

function inferCapacity(listing: ListingLikeForCaption): number | undefined {
  const beds = listing.bedrooms;
  if (beds == null || !Number.isFinite(beds)) return undefined;
  const b = Math.min(20, Math.max(0, beds));
  return Math.min(24, Math.max(1, b + 2));
}

export function inferListingKind(listing: ListingLikeForCaption): CaptionListingKind {
  const dt = (listing.listingDealType ?? "").toUpperCase();
  if (dt.includes("SHORT") || dt.includes("STAY") || dt.includes("RENT") || dt.includes("NIGHT")) return "stay";
  return "sale";
}

/**
 * Builds JSON-safe caption inputs from DB listing fields (never includes raw street address).
 */
export function buildCaptionInput(listing: ListingLikeForCaption): CaptionSafeInput {
  const amenitiesRaw = parseStringArrayJson(listing.servicesOffered);
  const highlightsRaw = parseStringArrayJson(listing.experienceTags);

  const keyAmenities = Array.from(
    new Set(
      amenitiesRaw
        .map(normalizeAmenityToken)
        .filter((x): x is string => typeof x === "string" && x.length > 0),
    ),
  ).slice(0, 12);

  const highlights = Array.from(
    new Set(
      highlightsRaw
        .map(normalizeHighlightToken)
        .filter((x): x is string => typeof x === "string" && x.length > 0),
    ),
  ).slice(0, 12);

  const pt = (listing.propertyType ?? "PROPERTY").trim() || "PROPERTY";

  return {
    title: listing.title.trim().slice(0, 200),
    city: listing.city.trim().slice(0, 120),
    neighborhood: listing.region?.trim().slice(0, 120) || undefined,
    propertyType: pt.replace(/_/g, " ").slice(0, 80),
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    capacity: inferCapacity(listing),
    surfaceSqft: listing.surfaceSqft ?? undefined,
    yearBuilt: listing.yearBuilt ?? undefined,
    keyAmenities,
    highlights,
    listingKind: inferListingKind(listing),
  };
}
