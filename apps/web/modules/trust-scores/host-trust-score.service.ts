import { prisma } from "@/lib/db";
import { BnhubFraudFlagStatus } from "@prisma/client";
import { computeHostReliabilitySignals } from "./host-reliability.service";

export type HostTrustSnapshot = {
  hostTrustScore: number;
  responseScore: number;
  cancellationScore: number;
  reviewScore: number;
  fraudPenaltyScore: number;
  /** Machine-readable codes — also surfaced as `penalties` for API consumers. */
  riskAdjustments: string[];
  reasons: string[];
  /** Numeric subscores for dashboards / explainers. */
  factors: {
    responseScore: number;
    cancellationScore: number;
    reviewScore: number;
    fraudPenaltyScore: number;
  };
  /** Ranking-relevant penalty labels (subset of risk signals). */
  penalties: string[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Explainable host trust — uses HostQuality, BNHub profiles, open fraud flags (penalty), not hidden.
 */
export async function buildHostTrustSnapshot(hostUserId: string): Promise<HostTrustSnapshot> {
  const [hq, profile, fraudOpen, reliability] = await Promise.all([
    prisma.hostQuality.findUnique({ where: { userId: hostUserId } }),
    prisma.bnhubHostProfile.findUnique({ where: { userId: hostUserId } }),
    prisma.bnhubFraudFlag.count({
      where: {
        hostUserId,
        status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW, BnhubFraudFlagStatus.ESCALATED] },
      },
    }),
    computeHostReliabilitySignals(hostUserId),
  ]);

  const reasons: string[] = [];
  const riskAdjustments: string[] = [];

  const reviewScore = hq?.qualityScore != null ? clamp((hq.qualityScore / 5) * 100, 0, 100) : 50;
  reasons.push(hq ? `Host review aggregate ~${hq.qualityScore.toFixed(2)}/5` : "No host quality row yet — neutral review component");

  const responseScore = hq?.avgResponseMinutes != null ? clamp(100 - Math.min(100, hq.avgResponseMinutes / 30), 0, 100) : 55;
  if (hq?.avgResponseMinutes != null) {
    reasons.push(`Avg response ~${Math.round(hq.avgResponseMinutes)} min`);
  }

  let cancellationScore = 70;
  if (reliability.sampleSize > 0) {
    cancellationScore = clamp(100 - reliability.cancelRate * 120, 0, 100);
    reasons.push(`Cancellation share (sample): ${(reliability.cancelRate * 100).toFixed(0)}%`);
    if (reliability.cancelRate > 0.15) riskAdjustments.push("elevated_cancellations");
  }

  let fraudPenaltyScore = 0;
  if (fraudOpen > 0) {
    fraudPenaltyScore = clamp(fraudOpen * 12, 0, 60);
    riskAdjustments.push(`open_fraud_flags:${fraudOpen}`);
    reasons.push(`${fraudOpen} open BNHub fraud flag(s) — ranking trust component reduced`);
  }

  let base = profile?.trustScore != null ? profile.trustScore : 52;
  base = clamp(base * 0.4 + reviewScore * 0.25 + responseScore * 0.2 + cancellationScore * 0.15 - fraudPenaltyScore, 0, 100);

  if (hq?.isSuperHost) {
    base = clamp(base + 4, 0, 100);
    reasons.push("Superhost badge — small positive nudge");
  }

  const penalties: string[] = [];
  if (fraudOpen > 0) penalties.push("open_fraud_flags");
  if (reliability.cancelRate > 0.15 && reliability.sampleSize > 0) penalties.push("elevated_cancellations");

  return {
    hostTrustScore: Math.round(base * 10) / 10,
    responseScore: Math.round(responseScore * 10) / 10,
    cancellationScore: Math.round(cancellationScore * 10) / 10,
    reviewScore: Math.round(reviewScore * 10) / 10,
    fraudPenaltyScore: Math.round(fraudPenaltyScore * 10) / 10,
    riskAdjustments,
    reasons,
    factors: {
      responseScore: Math.round(responseScore * 10) / 10,
      cancellationScore: Math.round(cancellationScore * 10) / 10,
      reviewScore: Math.round(reviewScore * 10) / 10,
      fraudPenaltyScore: Math.round(fraudPenaltyScore * 10) / 10,
    },
    penalties,
  };
}
