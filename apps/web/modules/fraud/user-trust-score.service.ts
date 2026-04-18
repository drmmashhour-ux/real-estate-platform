/**
 * LECIPM Launch + Fraud Protection System v1 — user trust score (0–100), explainable.
 * Complements BNHub listing `trustScore` / platform trust tables — does not replace them.
 */
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type UserTrustScoreResult = {
  trustScore: number;
  factors: { label: string; delta: number; detail: string }[];
};

/**
 * Heuristic trust score for marketplace guests/hosts — favor verified, completed stays, good payment history.
 */
export async function computeUserTrustScoreV1(userId: string): Promise<UserTrustScoreResult | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!u) return null;

  const [idv, completedBookings, failedPayments] = await Promise.all([
    prisma.identityVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
    prisma.booking.count({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.platformPayment.count({
      where: { userId, status: "failed" },
    }).catch(() => 0),
  ]);

  const factors: UserTrustScoreResult["factors"] = [];
  let score = 45;

  if (u.emailVerifiedAt) {
    factors.push({ label: "Email verified", delta: 12, detail: "Reduces throwaway account risk." });
    score += 12;
  } else {
    factors.push({ label: "Email not verified", delta: -10, detail: "Verification recommended." });
    score -= 10;
  }

  if (idv?.verificationStatus === "VERIFIED") {
    factors.push({ label: "Identity verified", delta: 20, detail: "Strong trust signal." });
    score += 20;
  }

  const bookingBonus = Math.min(25, completedBookings * 5);
  if (bookingBonus > 0) {
    factors.push({
      label: "Successful stays",
      delta: bookingBonus,
      detail: `${completedBookings} completed or confirmed booking(s).`,
    });
    score += bookingBonus;
  }

  if (failedPayments > 0) {
    const pen = Math.min(25, failedPayments * 8);
    factors.push({
      label: "Payment failures",
      delta: -pen,
      detail: `${failedPayments} failed/canceled platform payment(s).`,
    });
    score -= pen;
  }

  const accountAgeDays = (Date.now() - u.createdAt.getTime()) / (24 * 3600 * 1000);
  if (accountAgeDays >= 30) {
    factors.push({ label: "Established account", delta: 8, detail: "Older than 30 days." });
    score += 8;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { trustScore: score, factors };
}
