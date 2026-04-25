/**
 * BNHub user trust scoring — explainable, loggable, no automatic bans.
 * Uses real platform data only (bookings, payments, reviews, messages).
 */

import {
  BookingStatus,
  BnhubFraudSeverity,
  BnhubTrustRiskFlagTypeV2,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type {
  BnhubGuestTrustUiLabel,
  BnhubPlatformUserTrustScore,
  BnhubTrustRiskLevel,
  BnhubUserTrustFactor,
} from "./trust.types";

export type CalculateTrustScoreInput = {
  userId: string;
  listingId?: string | null;
  pendingBookingTotalCents?: number | null;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function riskLevelFromScore(score: number): BnhubTrustRiskLevel {
  if (score >= 62) return "LOW";
  if (score >= 42) return "MEDIUM";
  return "HIGH";
}

function uiLabelFrom(
  score: number,
  risk: BnhubTrustRiskLevel,
  accountAgeDays: number,
  completedGuestStays: number,
): BnhubGuestTrustUiLabel {
  if (risk === "HIGH" || score < 40) return "potential_risk";
  if (accountAgeDays < 14 || completedGuestStays < 2) return "new_user";
  if (score >= 72 && completedGuestStays >= 2) return "trusted_guest";
  return "standard";
}

function push(
  factors: BnhubUserTrustFactor[],
  fraudCodes: Set<string>,
  id: string,
  label: string,
  contribution: number,
  explanation: string,
  fraud?: string,
): void {
  factors.push({ id, label, contribution, explanation });
  if (fraud) fraudCodes.add(fraud);
}

/**
 * Computes BNHub trust score for a user (guest-first; includes host overlay when they list).
 * Idempotent reads; persists nothing (callers persist profiles / flags as needed).
 */
export async function calculateTrustScore(input: CalculateTrustScoreInput): Promise<BnhubPlatformUserTrustScore> {
  const { userId, listingId, pendingBookingTotalCents } = input;
  const factors: BnhubUserTrustFactor[] = [];
  const fraudSignalCodes = new Set<string>();

  const now = new Date();
  const day24h = new Date(now.getTime() - 86400000);
  const day30 = new Date(now.getTime() - 30 * 86400000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  const accountAgeDays = user ? Math.max(0, (now.getTime() - user.createdAt.getTime()) / 86400000) : 0;

  const [
    guestBookings,
    paymentsAsGuest,
    reviewsAsGuest,
    guestMessages30d,
    inquiryThreadsAsGuest,
    inquiryMessagesAsGuest30d,
    listingCount,
    hostBookings,
    idVerified,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId: userId },
      select: { status: true, createdAt: true, canceledAt: true },
    }),
    prisma.payment.findMany({
      where: { booking: { guestId: userId } },
      select: { status: true },
    }),
    prisma.review.aggregate({
      where: { guestId: userId },
      _avg: { propertyRating: true },
      _count: { id: true },
    }),
    prisma.bookingMessage.count({
      where: {
        senderId: userId,
        createdAt: { gte: day30 },
        booking: { guestId: userId },
      },
    }),
    prisma.bnhubInquiryThread.count({ where: { guestUserId: userId } }),
    prisma.bnhubInquiryMessage.count({
      where: {
        senderId: userId,
        createdAt: { gte: day30 },
        thread: { guestUserId: userId },
      },
    }),
    prisma.shortTermListing.count({ where: { ownerId: userId } }),
    prisma.booking.findMany({
      where: { listing: { ownerId: userId } },
      select: { status: true },
    }),
    prisma.bnhubTrustIdentityVerification.findFirst({
      where: {
        userId,
        verificationStatus: "VERIFIED",
      },
      select: { id: true },
    }),
  ]);

  let score = 52;

  const terminalSuccess = new Set<BookingStatus>([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]);
  const guestCancel = new Set<BookingStatus>([
    BookingStatus.CANCELLED_BY_GUEST,
    BookingStatus.CANCELLED,
  ]);
  const completedGuestStays = guestBookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
  const confirmedOrCompleted = guestBookings.filter((b) => terminalSuccess.has(b.status)).length;
  const cancelledGuest = guestBookings.filter((b) => guestCancel.has(b.status)).length;
  const rapidAttempts = guestBookings.filter((b) => b.createdAt >= day24h).length;

  if (accountAgeDays >= 730) {
    push(factors, fraudSignalCodes, "account_age", "Established account", 12, `Account age ~${Math.floor(accountAgeDays)} days.`);
    score += 12;
  } else if (accountAgeDays >= 365) {
    push(factors, fraudSignalCodes, "account_age", "Mature account", 9, `Account age ~${Math.floor(accountAgeDays)} days.`);
    score += 9;
  } else if (accountAgeDays >= 90) {
    push(factors, fraudSignalCodes, "account_age", "Seasoned account", 6, `Account age ~${Math.floor(accountAgeDays)} days.`);
    score += 6;
  } else if (accountAgeDays >= 30) {
    push(factors, fraudSignalCodes, "account_age", "Account aging in", 3, `Account age ~${Math.floor(accountAgeDays)} days.`);
    score += 3;
  } else {
    push(
      factors,
      fraudSignalCodes,
      "account_age",
      "New account",
      -4,
      `Account age ~${Math.floor(accountAgeDays)} days — limited history.`,
      "NEW_ACCOUNT",
    );
    score -= 4;
  }

  const stayHistoryPts = Math.min(10, completedGuestStays * 2);
  if (stayHistoryPts > 0) {
    push(
      factors,
      fraudSignalCodes,
      "booking_history",
      "Completed stays",
      stayHistoryPts,
      `${completedGuestStays} completed stay(s) as guest.`,
    );
    score += stayHistoryPts;
  } else {
    push(factors, fraudSignalCodes, "booking_history", "No completed stays yet", -2, "No completed guest stays on file.");
    score -= 2;
  }

  const denomSt = confirmedOrCompleted + cancelledGuest;
  if (denomSt > 0) {
    const cancelRate = cancelledGuest / denomSt;
    const pen = Math.round(cancelRate * 28);
    push(
      factors,
      fraudSignalCodes,
      "cancellation_rate",
      "Guest cancellation history",
      -pen,
      `Cancellation rate ~${Math.round(cancelRate * 100)}% across ${denomSt} substantive booking(s).`,
      cancelRate >= 0.45 ? "HIGH_CANCELLATION_RATE" : cancelRate >= 0.25 ? "ELEVATED_CANCELLATIONS" : "",
    );
    score -= pen;
  } else {
    push(factors, fraudSignalCodes, "cancellation_rate", "No cancellation baseline", 0, "Not enough bookings to measure cancellations.");
  }

  const payOk = paymentsAsGuest.filter((p) => p.status === PaymentStatus.COMPLETED).length;
  const payFail = paymentsAsGuest.filter((p) => p.status === PaymentStatus.FAILED).length;
  const payDenom = payOk + payFail;
  if (payDenom > 0) {
    const failRate = payFail / payDenom;
    const pen = Math.round(failRate * 18);
    push(
      factors,
      fraudSignalCodes,
      "payment_success",
      "Payment outcomes",
      -pen,
      `${payOk} completed vs ${payFail} failed payment attempt(s) on record.`,
      failRate >= 0.35 ? "PAYMENT_FAILURE_PATTERN" : "",
    );
    score -= pen;
  } else {
    push(factors, fraudSignalCodes, "payment_success", "Payments", 2, "No failed payment attempts recorded.");
    score += 2;
  }

  const rc = reviewsAsGuest._count.id;
  const avg = reviewsAsGuest._avg.propertyRating;
  if (rc > 0 && avg != null && Number.isFinite(avg)) {
    const bonus = Math.round(((avg - 3) / 2) * 10);
    const b = clamp(bonus, -8, 10);
    push(
      factors,
      fraudSignalCodes,
      "reviews",
      "Guest review history",
      b,
      `${rc} review(s); average property rating ${avg.toFixed(1)}/5.`,
    );
    score += b;
  } else {
    push(factors, fraudSignalCodes, "reviews", "Reviews", 0, "No guest reviews on file yet.");
  }

  const msgRatio =
    inquiryThreadsAsGuest > 0 ? inquiryMessagesAsGuest30d / inquiryThreadsAsGuest : inquiryMessagesAsGuest30d;
  if (msgRatio > 25) {
    push(
      factors,
      fraudSignalCodes,
      "message_behavior",
      "High pre-booking messaging volume",
      -6,
      "Unusually high inquiry message volume recently — pattern review.",
      "UNUSUAL_MESSAGING_PATTERN",
    );
    score -= 6;
  } else if (guestMessages30d > 0 || inquiryMessagesAsGuest30d > 0) {
    push(
      factors,
      fraudSignalCodes,
      "message_behavior",
      "Active messaging",
      2,
      "Recent booking or inquiry messages on file.",
    );
    score += 2;
  } else {
    push(factors, fraudSignalCodes, "message_behavior", "Messaging", 0, "Limited recent messaging data.");
  }

  if (rapidAttempts >= 4) {
    push(
      factors,
      fraudSignalCodes,
      "velocity",
      "Rapid booking attempts",
      -14,
      `${rapidAttempts} booking attempt(s) in the last 24 hours.`,
      "RAPID_BOOKING_ATTEMPTS",
    );
    score -= 14;
  } else if (rapidAttempts >= 3) {
    push(
      factors,
      fraudSignalCodes,
      "velocity",
      "Multiple recent booking attempts",
      -8,
      `${rapidAttempts} booking attempt(s) in the last 24 hours.`,
      "RAPID_BOOKING_ATTEMPTS",
    );
    score -= 8;
  }

  if (
    typeof pendingBookingTotalCents === "number" &&
    pendingBookingTotalCents > 0 &&
    accountAgeDays < 14 &&
    pendingBookingTotalCents > 250_000
  ) {
    push(
      factors,
      fraudSignalCodes,
      "mismatch",
      "New account, high first spend",
      -10,
      "Large booking total relative to very new account — manual review recommended if risk escalates.",
      "NEW_ACCOUNT_HIGH_VALUE_ATTEMPT",
    );
    score -= 10;
  }

  if (idVerified) {
    push(factors, fraudSignalCodes, "identity", "Identity verified", 8, "Government identity verification completed.");
    score += 8;
  }

  score = clamp(Math.round(score), 0, 100);
  const riskLevel = riskLevelFromScore(score);
  const uiLabel = uiLabelFrom(score, riskLevel, accountAgeDays, completedGuestStays);

  let hostScore: number | null = null;
  if (listingCount > 0 && hostBookings.length > 0) {
    const hostCompleted = hostBookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
    const hostCancelled = hostBookings.filter((b) =>
      [
        BookingStatus.CANCELLED_BY_HOST,
        BookingStatus.CANCELLED,
        BookingStatus.CANCELLED_BY_GUEST,
      ].includes(b.status),
    ).length;
    let h = 50 + Math.min(20, hostCompleted * 2) - Math.min(25, hostCancelled * 3);
    h = clamp(Math.round(h), 0, 100);
    hostScore = h;
    push(
      factors,
      fraudSignalCodes,
      "host_overlay",
      "Host activity (same account)",
      0,
      `User also hosts ${listingCount} listing(s); host-side completion signal factored separately (hostScore=${h}).`,
    );
  }

  const out: BnhubPlatformUserTrustScore = {
    userId,
    score,
    hostScore,
    riskLevel,
    factors,
    fraudSignalCodes: [...fraudSignalCodes].filter(Boolean),
    uiLabel,
    computedAt: now.toISOString(),
  };

  logInfo("[trust] bnhub_user_trust_score", {
    domain: "[trust]",
    userIdPrefix: userId.slice(0, 8),
    listingIdPrefix: listingId?.slice(0, 8),
    score: out.score,
    hostScore: out.hostScore,
    riskLevel: out.riskLevel,
    uiLabel: out.uiLabel,
    fraudSignalCodes: out.fraudSignalCodes,
    factorCount: out.factors.length,
  });

  return out;
}

/**
 * Opens an admin-review risk flag (never bans). Deduplicates recent OPEN flags per user.
 */
export async function flagBnhubUserTrustForReview(params: {
  userId: string;
  listingId: string | null;
  trust: BnhubPlatformUserTrustScore;
}): Promise<void> {
  const { userId, listingId, trust } = params;
  if (trust.riskLevel !== "HIGH") return;

  const since = new Date(Date.now() - 48 * 3600000 * 1000);
  const dup = await prisma.bnhubTrustRiskFlag.findFirst({
    where: {
      userId,
      flagType: BnhubTrustRiskFlagTypeV2.ABNORMAL_BEHAVIOR,
      flagStatus: "OPEN",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (dup) return;

  const summary = `Automated BNHub trust review: score=${trust.score}/100, risk=${trust.riskLevel}. Signals: ${trust.fraudSignalCodes.slice(0, 6).join(", ") || "none"}. No automatic enforcement — triage required.`;

  await prisma.bnhubTrustRiskFlag.create({
    data: {
      userId,
      listingId: listingId ?? undefined,
      flagType: BnhubTrustRiskFlagTypeV2.ABNORMAL_BEHAVIOR,
      severity: BnhubFraudSeverity.HIGH,
      visibilityScope: "ADMIN_ONLY",
      summary,
      evidenceJson: {
        score: trust.score,
        riskLevel: trust.riskLevel,
        uiLabel: trust.uiLabel,
        fraudSignalCodes: trust.fraudSignalCodes,
        factorIds: trust.factors.map((f) => f.id),
      },
    },
  });

  logInfo("[trust] bnhub_trust_review_flagged", {
    domain: "[trust]",
    userIdPrefix: userId.slice(0, 8),
    listingIdPrefix: listingId?.slice(0, 8),
    score: trust.score,
    riskLevel: trust.riskLevel,
  });
}
