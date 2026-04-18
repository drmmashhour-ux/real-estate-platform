/**
 * LECIPM Launch + Fraud Protection System v1 — unified fraud engine facade.
 * Wraps deterministic `computeFraudRiskScore` + optional enrichment; all decisions are explainable.
 */
import { prisma } from "@/lib/db";
import { fraudTrustV1Flags } from "@/config/feature-flags";
import { computeFraudRiskScore } from "@/src/modules/fraud/riskScoringEngine";
import type { FraudEntityType } from "@/src/modules/fraud/types";
import { logFraudEvent } from "@/modules/fraud/fraud-event-log.service";

export type LaunchFraudInput = {
  user?: { id: string; createdAt?: Date; emailVerifiedAt?: Date | null } | null;
  booking?: { id: string; guestId?: string; listingId?: string; checkIn?: Date; totalCents?: number } | null;
  payment?: { id: string; amountCents?: number; currency?: string; userId?: string } | null;
  listing?: { id: string } | null;
  metadata?: Record<string, unknown>;
};

export type LaunchFraudRecommendedAction = "allow" | "review" | "block";

export type LaunchFraudResult = {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  recommendedAction: LaunchFraudRecommendedAction;
  /** 0–1 underlying model score when available */
  baseScore01: number | null;
  /** Explainable detail for admins */
  signalsDetail: { code: string; explanation: string }[];
};

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function riskBandFrom100(score: number): "low" | "medium" | "high" {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

function recommendFromScore100(score: number): LaunchFraudRecommendedAction {
  if (score <= 30) return "allow";
  if (score <= 60) return "review";
  return "block";
}

async function enrichBookingPoints(bookingId: string): Promise<{ add: number; reasons: string[] }> {
  const reasons: string[] = [];
  let add = 0;
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      checkIn: true,
      createdAt: true,
      guestId: true,
      listing: { select: { nightPriceCents: true } },
    },
  });
  if (!b) return { add: 0, reasons: [] };

  const hoursToCheckIn = (b.checkIn.getTime() - b.createdAt.getTime()) / 36e5;
  if (hoursToCheckIn < 24 && hoursToCheckIn >= 0) {
    add += 15;
    reasons.push("Last-minute booking (<24h before check-in) increases dispute risk.");
  }

  const night = b.listing?.nightPriceCents ?? 0;
  if (night > 800_00) {
    add += 12;
    reasons.push("High nightly rate vs typical band — manual review suggested.");
  }

  const rapid = await prisma.booking.count({
    where: {
      guestId: b.guestId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (rapid >= 3) {
    add += 20;
    reasons.push("Multiple bookings within 24h from same guest.");
  }

  const guest = await prisma.user.findUnique({
    where: { id: b.guestId },
    select: { createdAt: true },
  });
  if (guest) {
    const createdHoursAgo = (Date.now() - guest.createdAt.getTime()) / 36e5;
    if (createdHoursAgo < 24) {
      add += 15;
      reasons.push("Guest account created within last 24 hours.");
    }
  }

  return { add, reasons };
}

async function enrichUserPoints(userId: string): Promise<{ add: number; reasons: string[] }> {
  const reasons: string[] = [];
  let add = 0;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!u) return { add: 0, reasons: [] };
  const hours = (Date.now() - u.createdAt.getTime()) / 36e5;
  if (hours < 24) {
    add += 15;
    reasons.push("New account (<24h) — elevated monitoring.");
  }

  const sessions = await prisma.session.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  }).catch(() => 0);
  if (sessions > 8) {
    add += 8;
    reasons.push("High session churn — possible automation (soft signal).");
  }

  return { add, reasons };
}

/**
 * Primary evaluation — combines legacy deterministic score (0–1) scaled to 0–100 with bounded enrichment.
 */
export async function evaluateLaunchFraudEngine(
  input: LaunchFraudInput,
  opts?: { persist?: boolean; actionType?: string }
): Promise<LaunchFraudResult> {
  const reasons: string[] = [];
  const signalsDetail: { code: string; explanation: string }[] = [];
  let base01: number | null = null;
  let entity: { type: FraudEntityType; id: string } | null = null;

  if (input.listing?.id) {
    entity = { type: "listing", id: input.listing.id };
  } else if (input.booking?.id) {
    entity = { type: "booking", id: input.booking.id };
  } else if (input.user?.id) {
    entity = { type: "user", id: input.user.id };
  }

  if (entity) {
    const computed = await computeFraudRiskScore(entity.type, entity.id);
    if (computed) {
      base01 = computed.riskScore;
      reasons.push(
        ...computed.signals.map((s) => `${s.code}: ${s.humanExplanation}`)
      );
      signalsDetail.push(
        ...computed.signals.map((s) => ({ code: s.code, explanation: s.humanExplanation }))
      );
    }
  }

  let score100 = base01 != null ? clamp100(base01 * 100) : 10;

  if (input.booking?.id) {
    const ex = await enrichBookingPoints(input.booking.id);
    score100 = clamp100(score100 + ex.add);
    reasons.push(...ex.reasons);
  }

  if (input.user?.id && !input.booking?.id) {
    const ex = await enrichUserPoints(input.user.id);
    score100 = clamp100(score100 + ex.add);
    reasons.push(...ex.reasons);
  }

  if (input.payment?.amountCents && input.payment.amountCents > 5_000_00 && input.user?.createdAt) {
    const h = (Date.now() - input.user.createdAt.getTime()) / 36e5;
    if (h < 48) {
      score100 = clamp100(score100 + 18);
      reasons.push("High-value first payment from a very new account.");
    }
  }

  const riskLevel = riskBandFrom100(score100);
  let recommendedAction = recommendFromScore100(score100);

  /** Product default: "block" becomes verification / review unless hard-block flag is on. */
  if (recommendedAction === "block" && !process.env.FEATURE_LAUNCH_FRAUD_HARD_BLOCK_V1) {
    recommendedAction = "review";
    reasons.push(
      "Policy: high risk queued for review (hard block disabled — set FEATURE_LAUNCH_FRAUD_HARD_BLOCK_V1=1 to allow automated deny)."
    );
  }

  const persist =
    opts?.persist !== false &&
    (fraudTrustV1Flags.fraudDetectionV1 || fraudTrustV1Flags.launchFraudProtectionV1);

  if (persist) {
    await logFraudEvent({
      userId: input.user?.id ?? input.booking?.guestId ?? input.payment?.userId ?? null,
      actionType: opts?.actionType ?? "launch_fraud_engine_v1",
      riskScore: score100,
      riskLevel,
      reasons,
      metadataJson: {
        entity,
        metadata: input.metadata ?? {},
        recommendedAction,
      },
    }).catch((e) => {
      console.error("[fraud-engine] logFraudEvent failed", e);
    });
  }

  return {
    riskScore: score100,
    riskLevel,
    reasons,
    recommendedAction,
    baseScore01: base01,
    signalsDetail,
  };
}
