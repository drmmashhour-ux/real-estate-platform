/**
 * Full broker gamification recompute — called from APIs/cron/hooks after meaningful events.
 */
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { POINT_VALUES } from "@/modules/gamification/broker-gamification-policy";
import { awardPoints, logGamificationEvent } from "@/modules/gamification/broker-points.service";
import { tryAwardBadge } from "@/modules/gamification/broker-badges.service";
import { updateActiveDayStreak, bumpStreak } from "@/modules/gamification/broker-streaks.service";

export async function recomputeBrokerGamification(brokerId: string): Promise<{ ok: boolean; notes: string[] }> {
  const notes: string[] = [];
  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: {
      role: true,
      brokerStatus: true,
      launchOnboardingCompletedAt: true,
    },
  });

  if (!user || user.role !== PlatformRole.BROKER) {
    return { ok: false, notes: ["not_broker"] };
  }

  if (user.launchOnboardingCompletedAt) {
    const r = await awardPoints({
      brokerId,
      points: POINT_VALUES.onboardingComplete,
      reason: "Launch onboarding completed",
      category: "ONBOARDING",
      dedupeKey: "onboarding_launch_done",
    });
    if (r.ok) notes.push("onboarding_points");
  }

  const txCount = await prisma.realEstateTransaction.count({
    where: { brokerId },
  });
  if (txCount >= 1) {
    const r = await awardPoints({
      brokerId,
      points: POINT_VALUES.firstTransaction,
      reason: "First transaction as broker",
      category: "TRANSACTION",
      dedupeKey: "first_transaction",
    });
    if (r.ok) notes.push("first_tx");
  }

  const docCount = await prisma.generatedDocument.count({
    where: { generatedById: brokerId },
  });
  if (docCount >= 1) {
    const r = await awardPoints({
      brokerId,
      points: POINT_VALUES.firstDocument,
      reason: "First generated document",
      category: "QUALITY",
      dedupeKey: "first_document",
    });
    if (r.ok) notes.push("first_doc");
  }

  const signed = await prisma.generatedDocument.findFirst({
    where: { generatedById: brokerId, status: "signed" },
  });
  if (signed) {
    const r = await awardPoints({
      brokerId,
      points: POINT_VALUES.signatureCompleted,
      reason: "Signature completed on generated document",
      category: "QUALITY",
      dedupeKey: "first_signature_complete",
    });
    if (r.ok) notes.push("signature");
  }

  const dealsClosed = await prisma.deal.count({
    where: { brokerId, status: "closed" },
  });
  if (dealsClosed >= 1) {
    const r = await awardPoints({
      brokerId,
      points: POINT_VALUES.dealClosedClean,
      reason: "Deal reached closed status",
      category: "TRANSACTION",
      dedupeKey: "first_deal_closed",
    });
    if (r.ok) notes.push("deal_closed");
  }

  let leads: {
    id: string;
    createdAt: Date;
    lastContactAt: Date | null;
    status: string;
    nextFollowUpAt: Date | null;
  }[] = [];

  try {
    leads = await prisma.lecipmBrokerCrmLead.findMany({
      where: { brokerUserId: brokerId },
      select: {
        id: true,
        createdAt: true,
        lastContactAt: true,
        status: true,
        nextFollowUpAt: true,
      },
      take: 300,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    leads = [];
  }

  let fastCount = 0;
  for (const L of leads) {
    if (L.lastContactAt) {
      const delta = L.lastContactAt.getTime() - L.createdAt.getTime();
      if (delta <= 3600000 && delta >= 0) {
        const r = await awardPoints({
          brokerId,
          points: POINT_VALUES.fastLeadResponse1h,
          reason: "Lead first touch within 1 hour",
          category: "SPEED",
          dedupeKey: `fast_lead_${L.id}`,
        });
        if (r.ok) fastCount++;
      }
    }

    if (
      L.nextFollowUpAt &&
      L.nextFollowUpAt.getTime() < Date.now() &&
      L.status !== "closed" &&
      L.status !== "lost"
    ) {
      await awardPoints({
        brokerId,
        points: POINT_VALUES.overdueActionPenalty,
        reason: "Follow-up overdue",
        category: "COMPLIANCE",
        dedupeKey: `overdue_once_${L.id}`,
      });
    }

    if (
      !L.lastContactAt &&
      L.status === "new" &&
      L.createdAt.getTime() < Date.now() - 72 * 3600000
    ) {
      await awardPoints({
        brokerId,
        points: POINT_VALUES.ignoredLeadPenalty,
        reason: "Lead untouched beyond SLA window",
        category: "LEADS",
        dedupeKey: `ignored_${L.id}`,
      });
    }
  }

  await bumpStreak(brokerId, "FAST_RESPONSE", Math.min(30, fastCount));

  const profile = await prisma.brokerServiceProfile.findUnique({
    where: { brokerId },
    select: { payload: true },
  });
  if (profile?.payload && typeof profile.payload === "object") {
    const keys = Object.keys(profile.payload as object);
    if (keys.length >= 6) {
      const r = await awardPoints({
        brokerId,
        points: POINT_VALUES.profileComplete,
        reason: "Service profile substantially complete",
        category: "QUALITY",
        dedupeKey: "profile_complete_v1",
      });
      if (r.ok) notes.push("profile");
    }
  }

  if (user.brokerStatus === "VERIFIED") {
    await awardPoints({
      brokerId,
      points: POINT_VALUES.complianceBonus,
      reason: "Verified broker status",
      category: "COMPLIANCE",
      dedupeKey: "compliance_verified_bonus",
    });
  }

  const signedRecent = await prisma.generatedDocument.count({
    where: { generatedById: brokerId, status: "signed" },
  });
  await bumpStreak(brokerId, "DOC_COMPLETION", Math.min(40, signedRecent));

  const activeDays = await updateActiveDayStreak(brokerId);

  if (txCount >= 1) await tryAwardBadge(brokerId, "FIRST_DEAL");
  if (fastCount >= 5) await tryAwardBadge(brokerId, "FAST_RESPONDER");
  if (user.brokerStatus === "VERIFIED") await tryAwardBadge(brokerId, "COMPLIANCE_STAR");
  if (docCount >= 3) await tryAwardBadge(brokerId, "DOCUMENT_PRO");
  if (activeDays >= 7) await tryAwardBadge(brokerId, "STREAK_7");
  if (activeDays >= 30) await tryAwardBadge(brokerId, "STREAK_30");

  const dealsWon = await prisma.deal.count({
    where: { brokerId, status: "closed" },
  });
  const convRatio = leads.length ? dealsWon / Math.max(1, leads.length) : 0;
  if (convRatio >= 0.25 && leads.length >= 8) await tryAwardBadge(brokerId, "TOP_CONVERTER");

  const totalPts = await prisma.brokerPointsLedger.aggregate({
    where: { brokerId },
    _sum: { points: true },
  });
  if ((totalPts._sum.points ?? 0) >= 400 && user.brokerStatus === "VERIFIED") {
    await tryAwardBadge(brokerId, "TRUSTED_BROKER");
  }

  await logGamificationEvent(brokerId, "RECOMPUTE_DONE", { notes });

  return { ok: true, notes };
}
