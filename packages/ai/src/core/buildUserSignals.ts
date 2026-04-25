import { prisma } from "@/lib/db";
import type { UserSignals } from "./types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Normalized guest/user signals — merges `UserSearchProfile` + `UserIntelligenceProfile` + light activity.
 */
export async function buildUserSignals(userId: string): Promise<UserSignals | null> {
  const [user, searchProf, intelProf] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.userSearchProfile.findUnique({ where: { userId } }),
    prisma.userIntelligenceProfile.findUnique({ where: { userId } }),
  ]);
  if (!user) return null;

  const since = new Date(Date.now() - 60 * 86400000);
  const [eventCount, saveCount, bookingCount] = await Promise.all([
    prisma.searchEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.bnhubGuestFavorite.count({ where: { guestUserId: userId } }),
    prisma.booking.count({
      where: {
        guestId: userId,
        createdAt: { gte: since },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
    }),
  ]);

  const engagement = clamp01(Math.log1p(eventCount) / Math.log1p(80) * 0.5 + Math.log1p(saveCount) / Math.log1p(40) * 0.5);
  const bookingIntent = clamp01(Math.log1p(bookingCount + 1) / Math.log1p(6) * 0.55 + engagement * 0.45);
  const luxury = intelProf?.luxuryPreferenceScore ?? clamp01((searchProf?.preferredPriceMax ?? 200) / 800);

  return {
    userId,
    preferredCities: intelProf?.preferredCities?.length ? intelProf.preferredCities : searchProf?.preferredCities ?? [],
    preferredTypes: intelProf?.preferredTypes?.length ? intelProf.preferredTypes : searchProf?.preferredTypes ?? [],
    preferredPriceMin: intelProf?.preferredPriceMin ?? searchProf?.preferredPriceMin ?? null,
    preferredPriceMax: intelProf?.preferredPriceMax ?? searchProf?.preferredPriceMax ?? null,
    preferredGuests: intelProf?.preferredGuests ?? searchProf?.preferredGuests ?? null,
    preferredAmenities: intelProf?.preferredAmenities?.length
      ? intelProf.preferredAmenities
      : searchProf?.preferredAmenities ?? [],
    engagementScore: intelProf?.engagementScore ?? engagement,
    bookingIntentScore: intelProf?.bookingIntentScore ?? bookingIntent,
    luxuryPreferenceScore: intelProf?.luxuryPreferenceScore ?? luxury,
  };
}
