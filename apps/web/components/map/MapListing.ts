/**
 * Generic listing shape for MapView. Reusable across BNHUB, real-estate, projects, luxury.
 */
export type MapListing = {
  id: string;
  latitude: number;
  longitude: number;
  price: number;
  title: string;
  /** Optional image URL for popup */
  image?: string | null;
  /** Optional single-line address (city, region) for map popup */
  address?: string | null;
  /** Optional link for "View listing" (e.g. /bnhub/[id]) */
  href?: string;
  /** Integer 0–100 — drives pin color and heat weight */
  aiScore?: number;
  /** Buy vs rent context for pin styling */
  dealKind?: "sale" | "rent";
  /** FSBO pipeline status when available */
  transactionKey?: "offer_received" | "offer_accepted" | "sold";
  transactionLabel?: string;
  /** True when the listing is on this platform (FSBO or CRM marketplace) — shows brand mark on the map pin. */
  platformListing?: boolean;
  /** Overrides default “For sale” / “For rent” line in the map popup (e.g. BNHUB: “Nightly stay”). */
  listingHeadline?: string;
  /** Guest review average on a 1–5 scale (BNHUB propertyRating aggregate). */
  reviewAverageOutOf5?: number | null;
  /** Number of published reviews counted toward the average. */
  reviewCount?: number | null;
  /** When there is no 1–5 aggregate yet, BNHUB-style estimated score /10 (with `guestScoreLabel`). */
  guestScoreOutOf10?: number | null;
  guestScoreLabel?: string | null;
  /** Freeform line when there is no numeric rating (e.g. Broker Hub CRM listings). */
  mapRatingNote?: string | null;
};

export function hasValidCoordinates(
  listing: { latitude?: number | null; longitude?: number | null }
): boolean {
  const lat = listing.latitude;
  const lng = listing.longitude;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
