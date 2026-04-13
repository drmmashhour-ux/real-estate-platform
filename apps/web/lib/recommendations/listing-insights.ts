/**
 * Optional copy for hosts — why a listing may rank well or poorly in recommendations (heuristic).
 */

export type ListingRecommendationInsight = {
  positive: string[];
  negative: string[];
};

export function bnhubListingRecommendationInsight(args: {
  views30d: number;
  savesOrFavorites: number;
  bookings30d: number;
  nightPriceCents: number;
  medianNightPriceCents: number | null;
  photoCount: number;
  reviewCount: number;
}): ListingRecommendationInsight {
  const pos: string[] = [];
  const neg: string[] = [];

  if (args.views30d >= 40) pos.push("Strong recent visibility in search and discovery.");
  if (args.bookings30d >= 2) pos.push("Healthy booking velocity — signals demand.");
  if (args.savesOrFavorites >= 5) pos.push("Guests are saving this stay — strong intent signal.");
  if (args.photoCount >= 6) pos.push("Photo coverage helps click-through in recommendation carousels.");
  if (args.reviewCount >= 5) pos.push("Review volume improves trust in personalized modules.");

  if (args.views30d < 8 && args.bookings30d === 0) neg.push("Low exposure — consider pricing, photos, or promotions.");
  if (args.medianNightPriceCents != null && args.medianNightPriceCents > 0) {
    const r = args.nightPriceCents / args.medianNightPriceCents;
    if (r < 0.65 || r > 1.6) neg.push("Price is far from comparable stays — may reduce similarity matching.");
  }
  if (args.photoCount < 4) neg.push("Thin media — recommendation widgets favor complete listings.");

  return { positive: pos, negative: neg };
}
