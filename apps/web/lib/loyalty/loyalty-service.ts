import type { PrismaClient } from "@prisma/client";
import { LoyaltyTier } from "@prisma/client";
import {
  loyaltyDiscountCentsFromPercent,
  loyaltyTierFromCompletedBookings,
  type LoyaltyTierCode,
} from "./loyalty-engine";

function prismaTierToCode(t: LoyaltyTier): LoyaltyTierCode {
  switch (t) {
    case LoyaltyTier.NONE:
      return "NONE";
    case LoyaltyTier.BRONZE:
      return "BRONZE";
    case LoyaltyTier.SILVER:
      return "SILVER";
    case LoyaltyTier.GOLD:
      return "GOLD";
    default:
      return "NONE";
  }
}

function codeToPrismaTier(c: LoyaltyTierCode): LoyaltyTier {
  switch (c) {
    case "BRONZE":
      return LoyaltyTier.BRONZE;
    case "SILVER":
      return LoyaltyTier.SILVER;
    case "GOLD":
      return LoyaltyTier.GOLD;
    default:
      return LoyaltyTier.NONE;
  }
}

export async function getOrCreateUserLoyaltyProfile(db: PrismaClient, userId: string) {
  const existing = await db.userLoyaltyProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.userLoyaltyProfile.create({
    data: {
      userId,
      totalBookings: 0,
      completedBookings: 0,
      tier: LoyaltyTier.NONE,
    },
  });
}

/**
 * Loyalty lodging discount for pricing — uses **completedBookings** before this checkout.
 */
export async function getLoyaltyLodgingDiscountForGuest(
  db: PrismaClient,
  userId: string,
  subtotalCents: number,
): Promise<{
  loyaltyDiscountCents: number;
  tier: LoyaltyTierCode;
  discountPercent: number;
  label: string;
}> {
  const profile = await getOrCreateUserLoyaltyProfile(db, userId);
  const tierInfo = loyaltyTierFromCompletedBookings(profile.completedBookings);
  const loyaltyDiscountCents = loyaltyDiscountCentsFromPercent(subtotalCents, tierInfo.discountPercent);
  return {
    loyaltyDiscountCents,
    tier: tierInfo.tier,
    discountPercent: tierInfo.discountPercent,
    label: tierInfo.label,
  };
}

/**
 * Idempotent: unique `bookingId` on `LoyaltyRewardEvent` prevents double increment on webhook retries.
 */
export async function applyLoyaltyCreditForPaidBooking(
  db: PrismaClient,
  input: { bookingId: string; guestUserId: string },
): Promise<{ ok: true; skipped: boolean } | { ok: false; error: string }> {
  try {
    await db.$transaction(async (tx) => {
      const profile = await tx.userLoyaltyProfile.upsert({
        where: { userId: input.guestUserId },
        create: {
          userId: input.guestUserId,
          totalBookings: 0,
          completedBookings: 0,
          tier: LoyaltyTier.NONE,
        },
        update: {},
      });

      const tierBeforeInfo = loyaltyTierFromCompletedBookings(profile.completedBookings);
      const nextCompleted = profile.completedBookings + 1;
      const nextTotal = profile.totalBookings + 1;
      const tierAfterInfo = loyaltyTierFromCompletedBookings(nextCompleted);

      await tx.loyaltyRewardEvent.create({
        data: {
          bookingId: input.bookingId,
          userId: input.guestUserId,
          tierBefore: codeToPrismaTier(tierBeforeInfo.tier),
          tierAfter: codeToPrismaTier(tierAfterInfo.tier),
          discountPercentApplied: null,
        },
      });

      await tx.userLoyaltyProfile.update({
        where: { userId: input.guestUserId },
        data: {
          totalBookings: nextTotal,
          completedBookings: nextCompleted,
          lastBookingAt: new Date(),
          tier: codeToPrismaTier(tierAfterInfo.tier),
        },
      });
    });
    return { ok: true, skipped: false };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/Unique constraint|unique constraint/i.test(msg)) {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: msg };
  }
}

export function tierBadgeLabel(tier: LoyaltyTierCode): string {
  switch (tier) {
    case "GOLD":
      return "Gold";
    case "SILVER":
      return "Silver";
    case "BRONZE":
      return "Bronze";
    default:
      return "Member";
  }
}

export { prismaTierToCode };
