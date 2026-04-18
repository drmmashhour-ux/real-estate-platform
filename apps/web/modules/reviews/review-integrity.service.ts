/**
 * Flags suspicious review patterns — does not mutate reviews.
 */
import { prisma } from "@/lib/db";

export type ReviewIntegrityStatus = "ok" | "review" | "high_risk";

export async function analyzeListingReviewIntegrity(listingId: string): Promise<{
  integrityStatus: ReviewIntegrityStatus;
  suspiciousPatterns: string[];
}> {
  const reviews = await prisma.review.findMany({
    where: { listingId },
    select: {
      id: true,
      guestId: true,
      propertyRating: true,
      spamScore: true,
      moderationHeld: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const suspiciousPatterns: string[] = [];
  if (reviews.length === 0) {
    return { integrityStatus: "ok", suspiciousPatterns };
  }

  const byGuest = new Map<string, number>();
  for (const r of reviews) {
    byGuest.set(r.guestId, (byGuest.get(r.guestId) ?? 0) + 1);
  }
  for (const [gid, n] of byGuest) {
    if (n > 3) suspiciousPatterns.push(`many_reviews_same_guest:${gid}`);
  }

  const spammy = reviews.filter((r) => (r.spamScore ?? 0) > 0.65);
  if (spammy.length > 0) suspiciousPatterns.push(`elevated_spam_scores:${spammy.length}`);

  const held = reviews.filter((r) => r.moderationHeld);
  if (held.length > reviews.length * 0.3 && reviews.length >= 5) {
    suspiciousPatterns.push("high_moderation_hold_rate");
  }

  const allSame =
    reviews.length >= 6 &&
    reviews.every((r) => r.propertyRating === reviews[0]?.propertyRating);
  if (allSame) suspiciousPatterns.push("uniform_star_rating_pattern");

  let integrityStatus: ReviewIntegrityStatus = "ok";
  if (suspiciousPatterns.length > 0) integrityStatus = "review";
  if (spammy.length >= 3 || held.length > reviews.length * 0.5) integrityStatus = "high_risk";

  return { integrityStatus, suspiciousPatterns };
}
