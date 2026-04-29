/** BNHub listing trust score for guest UI (heuristic / illustrative). */

type MockReview = { propertyRating: number };

type MockListing = {
  host?: { isVerified?: boolean };
  price?: number;
  description?: string;
};

export function calculateTrustScore(
  listing: MockListing,
  reviews: MockReview[]
): { score: number; badges: string[]; signals: string[] } {
  const n = reviews.length;
  const avg = n > 0 ? reviews.reduce((a, r) => a + r.propertyRating, 0) / n : 3.5;
  let score = Math.min(5, Math.max(1, avg * 0.92 + (listing.host?.isVerified ? 0.25 : 0)));
  if (n >= 3) score = Math.min(5, score + 0.15);
  if ((listing.description?.length ?? 0) > 80) score = Math.min(5, score + 0.08);

  const badges: string[] = [];
  if (listing.host?.isVerified) badges.push("Verified host");
  if (avg >= 4.7) badges.push("Highly rated");
  if (n >= 5) badges.push("Established reviews");

  const signals: string[] = [
    "Identity signals follow platform verification policy (illustrative).",
    n > 0 ? `Recent guest ratings average ${avg.toFixed(1)} / 5.` : "Limited public review history — treat estimates cautiously.",
  ];

  return { score, badges, signals };
}
