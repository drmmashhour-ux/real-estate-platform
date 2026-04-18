import { prisma } from "@/lib/db";
import { computeGuestBookingBehavior } from "./guest-behavior.service";

export type GuestTrustSnapshot = {
  guestTrustScore: number;
  bookingBehaviorScore: number;
  paymentReliabilityScore: number;
  fraudPenaltyScore: number;
  riskAdjustments: string[];
  reasons: string[];
  factors: {
    bookingBehaviorScore: number;
    paymentReliabilityScore: number;
    fraudPenaltyScore: number;
  };
  /** Ranking / risk penalty labels (guest-scoped fraud hooks reserved). */
  penalties: string[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export async function buildGuestTrustSnapshot(guestUserId: string): Promise<GuestTrustSnapshot> {
  const [user, profile, behavior] = await Promise.all([
    prisma.user.findUnique({
      where: { id: guestUserId },
      select: { createdAt: true, bnhubGuestTrustScore: true },
    }),
    prisma.bnhubGuestProfile.findUnique({ where: { userId: guestUserId } }),
    computeGuestBookingBehavior(guestUserId),
  ]);

  const reasons: string[] = [];
  const riskAdjustments: string[] = [];

  let bookingBehaviorScore = 55;
  if (behavior.sampleSize > 0) {
    bookingBehaviorScore = clamp(40 + behavior.completionRate * 60 - (behaviourCancelPenalty(behavior) ? 15 : 0), 0, 100);
    reasons.push(`${behavior.completed} completed stays / ${behavior.sampleSize} bookings sampled`);
  } else {
    reasons.push("Limited booking history — neutral behavior score");
  }

  const accountAgeDays = user ? (Date.now() - user.createdAt.getTime()) / (86400000) : 0;
  if (accountAgeDays > 365) {
    bookingBehaviorScore = clamp(bookingBehaviorScore + 3, 0, 100);
    reasons.push("Established account age");
  }

  let paymentReliabilityScore = profile?.trustScore != null ? clamp(profile.trustScore, 0, 100) : 55;
  if (user?.bnhubGuestTrustScore != null) {
    paymentReliabilityScore = clamp((paymentReliabilityScore + user.bnhubGuestTrustScore) / 2, 0, 100);
    reasons.push("Merged platform guest trust field");
  }

  /** Reserved — wire to guest-scoped risk models when available (BnHub fraud rows are listing/host keyed). */
  const fraudPenaltyScore = 0;

  const guestTrustScore = clamp(bookingBehaviorScore * 0.5 + paymentReliabilityScore * 0.5 - fraudPenaltyScore, 0, 100);

  const penalties: string[] = [];
  if (behaviourCancelPenalty(behavior)) penalties.push("high_guest_cancellation_rate");

  return {
    guestTrustScore: Math.round(guestTrustScore * 10) / 10,
    bookingBehaviorScore: Math.round(bookingBehaviorScore * 10) / 10,
    paymentReliabilityScore: Math.round(paymentReliabilityScore * 10) / 10,
    fraudPenaltyScore: Math.round(fraudPenaltyScore * 10) / 10,
    riskAdjustments,
    reasons,
    factors: {
      bookingBehaviorScore: Math.round(bookingBehaviorScore * 10) / 10,
      paymentReliabilityScore: Math.round(paymentReliabilityScore * 10) / 10,
      fraudPenaltyScore: Math.round(fraudPenaltyScore * 10) / 10,
    },
    penalties,
  };
}

function behaviourCancelPenalty(b: { cancelled: number; sampleSize: number }): boolean {
  if (b.sampleSize < 4) return false;
  return b.cancelled / b.sampleSize > 0.35;
}
