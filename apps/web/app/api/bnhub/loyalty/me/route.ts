import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loyaltyTierFromCompletedBookings } from "@/lib/loyalty/loyalty-engine";
import { getOrCreateUserLoyaltyProfile } from "@/lib/loyalty/loyalty-service";

export const dynamic = "force-dynamic";

/** GET /api/bnhub/loyalty/me — current guest BNHUB loyalty tier (requires session). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getOrCreateUserLoyaltyProfile(prisma, userId);
  const tier = loyaltyTierFromCompletedBookings(profile.completedBookings);
  return Response.json({
    ok: true,
    userId,
    completedBookings: profile.completedBookings,
    totalBookings: profile.totalBookings,
    lastBookingAt: profile.lastBookingAt?.toISOString() ?? null,
    tier: tier.tier,
    discountPercent: tier.discountPercent,
    label: tier.label,
    explanation: tier.explanation,
  });
}
