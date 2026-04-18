import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { evaluateReferralSuspicion } from "./referral-eligibility.service";
import type { ReferralGrowthEventType } from "./referral.types";

const WINDOW_MS = 30 * 86400000;

/**
 * Records a referral touch for dedupe + suspicion scoring. Does not grant rewards (billing not wired here).
 */
export async function recordReferralAttributionV2(params: {
  referralCode: string;
  ownerUserId: string;
  sessionId?: string | null;
  attributedUserId?: string | null;
  eventType: ReferralGrowthEventType;
}): Promise<{ id: string; reviewStatus: string } | null> {
  if (!engineFlags.referralEngineV2) return null;

  const recent = await prisma.referralGrowthAttribution.findFirst({
    where: {
      referralCode: params.referralCode,
      createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  const suspicion = evaluateReferralSuspicion({
    ownerUserId: params.ownerUserId,
    attributedUserId: params.attributedUserId,
    lastReferralSeconds: recent ? (Date.now() - recent.createdAt.getTime()) / 1000 : null,
  });

  const row = await prisma.referralGrowthAttribution.create({
    data: {
      referralCode: params.referralCode,
      sessionId: params.sessionId ?? null,
      ownerUserId: params.ownerUserId,
      attributedUserId: params.attributedUserId ?? null,
      eventType: params.eventType,
      attributionStatus: suspicion.suspicionScore >= 70 ? "held_for_review" : "attributed",
      suspicionScore: suspicion.suspicionScore,
      reviewStatus: suspicion.suspicionScore >= 70 ? "pending" : null,
      metadataJson: { flags: suspicion.flags },
    },
  });

  return { id: row.id, reviewStatus: row.reviewStatus ?? "clean" };
}
