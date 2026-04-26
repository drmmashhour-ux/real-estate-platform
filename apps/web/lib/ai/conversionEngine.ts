export type ConversionListingInput = {
  views?: number;
  bookings?: number;
  rating?: number;
};

/**
 * Funnel heuristics for listing conversion (view → booking) and quality (rating).
 */
export function analyzeConversion(listing: ConversionListingInput) {
  const actions: string[] = [];
  const views = typeof listing.views === "number" ? listing.views : 0;
  const bookings = typeof listing.bookings === "number" ? listing.bookings : 0;
  const rating = typeof listing.rating === "number" ? listing.rating : 5;

  if (views > 100 && bookings === 0) {
    actions.push("Reduce price");
    actions.push("Improve images");
    actions.push("Add urgency badge");
  }

  if (rating < 4) {
    actions.push("Improve service quality");
  }

  return {
    conversionScore: bookings / Math.max(1, views),
    actions,
  };
}
