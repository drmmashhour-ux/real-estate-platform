/**
 * lightweight trust / urgency copy for listing cards (Order 46).
 * Pass optional metrics when available (API may omit views/rating).
 */
export type SocialProofListingInput = {
  bookings?: number;
  views?: number;
  rating?: number;
};

function n(v: unknown): number {
  if (v == null) return 0;
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function generateSocialProof(listing: SocialProofListingInput): string[] {
  const messages: string[] = [];
  const bookings = n(listing.bookings);
  const views = n(listing.views);
  const rating = n(listing.rating);

  if (bookings > 10) {
    messages.push(`${bookings} people booked this`);
  }
  if (views > 100) {
    messages.push("High interest listing");
  }
  if (rating >= 4.8) {
    messages.push("Top-rated property");
  }
  return messages;
}
