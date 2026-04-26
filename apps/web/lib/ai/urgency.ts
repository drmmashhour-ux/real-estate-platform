/**
 * Light-touch urgency copy for listing / booking surfaces (no network calls).
 */
export type UrgencyListingInput = {
  /** Confirmed or notable booking volume signal (e.g. count of stay rows). */
  bookings?: number;
  /** Impression / view count when available. */
  views?: number;
};

export function generateUrgency(listing: UrgencyListingInput): string[] {
  const messages: string[] = [];
  if (typeof listing.bookings === "number" && listing.bookings > 5) {
    messages.push("🔥 High demand");
  }
  if (typeof listing.views === "number" && listing.views > 50) {
    messages.push("👀 Many people viewing");
  }
  return messages;
}
