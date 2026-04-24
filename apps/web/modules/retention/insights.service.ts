/**
 * Composes dashboard / API payloads — transparent summaries only.
 */
import { buildGuestBehaviorProfile } from "./guest-behavior.service";
import { buildPriceAlertSuggestionsForGuest } from "./offers.service";
import { buildStayRecommendations } from "./recommendations.service";
import { computeReturnScore } from "./return-score";
import { resolveRetentionSegment, segmentDescription } from "./segments";

export type GuestRetentionInsights = {
  segment: ReturnType<typeof resolveRetentionSegment>;
  segmentNote: string;
  returnScore: ReturnType<typeof computeReturnScore>;
  recommendations: Awaited<ReturnType<typeof buildStayRecommendations>>;
  priceSuggestions: Awaited<ReturnType<typeof buildPriceAlertSuggestionsForGuest>>;
  behaviorSummary: {
    lastActivityAt: string | null;
    completedBookings: number;
    savesTotal: number;
    bookingCities: string[];
    searchesLast30d: number;
  };
  transparency: string[];
};

export async function buildGuestRetentionInsights(userId: string): Promise<GuestRetentionInsights | null> {
  const profile = await buildGuestBehaviorProfile(userId);
  if (!profile) return null;

  const segment = resolveRetentionSegment(profile);
  const [recommendations, priceSuggestions] = await Promise.all([
    buildStayRecommendations(userId, profile),
    buildPriceAlertSuggestionsForGuest(userId),
  ]);

  const transparency = [
    "Segments use only platform events (searches, views, saves, bookings) — no third-party scores.",
    "Return score is a weighted heuristic; it is not a prediction of revenue.",
    "Nurture emails respect weekly caps, quiet hours, and notification consent.",
  ];

  return {
    segment,
    segmentNote: segmentDescription(segment),
    returnScore: computeReturnScore(profile),
    recommendations,
    priceSuggestions,
    behaviorSummary: {
      lastActivityAt: profile.lastActivityAt?.toISOString() ?? null,
      completedBookings: profile.completedBookings,
      savesTotal: profile.savesTotal,
      bookingCities: profile.bookingCities.slice(0, 8),
      searchesLast30d: profile.searchEvents30d + profile.clientSearchEvents30d,
    },
    transparency,
  };
}
