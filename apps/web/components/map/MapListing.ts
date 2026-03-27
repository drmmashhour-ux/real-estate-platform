/**
 * Generic listing shape for MapView. Reusable across BNHub, real-estate, projects, luxury.
 */
export type MapListing = {
  id: string;
  latitude: number;
  longitude: number;
  price: number;
  title: string;
  /** Optional image URL for popup */
  image?: string | null;
  /** Optional link for "View listing" (e.g. /bnhub/[id]) */
  href?: string;
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
