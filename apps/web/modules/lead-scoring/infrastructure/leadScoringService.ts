import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import { scoreLeadFromSignals } from "../application/scoreLead";
import type { LeadScoreResult, LeadScoreSignals } from "../domain/leadScore";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { AnalyticsEvents } from "@/lib/analytics/events";

const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

async function collectSignals(db: PrismaClient, userId: string): Promise<LeadScoreSignals> {
  const [
    crmListings,
    shortTerm,
    fsbo,
    copilotRuns,
    dealAnalysisFsbo,
    dealAnalysisBnhub,
    verifiedShort,
    verifiedFsbo,
    lastCopilot,
    activeSub,
  ] = await Promise.all([
    db.listing.count({ where: { ownerId: userId } }),
    db.shortTermListing.count({ where: { ownerId: userId } }),
    db.fsboListing.count({ where: { ownerId: userId } }),
    db.copilotRun.count({ where: { userId } }),
    db.dealAnalysis.count({ where: { listing: { ownerId: userId } } }),
    db.dealAnalysis.count({ where: { bnhubListing: { ownerId: userId } } }),
    db.shortTermListing.count({
      where: { ownerId: userId, listingVerificationStatus: "VERIFIED" },
    }),
    db.fsboListing.count({
      where: {
        ownerId: userId,
        verification: { identityStatus: "VERIFIED" },
      },
    }),
    db.copilotRun.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.subscription.findFirst({
      where: { userId, status: { in: PAYING } },
      select: { id: true },
    }),
  ]);

  const listingCount = crmListings + shortTerm + fsbo;
  const dealAnalysisCount = dealAnalysisFsbo + dealAnalysisBnhub;
  const verifiedListingCount = verifiedShort + verifiedFsbo;

  const userRow = await db.user.findUnique({
    where: { id: userId },
    select: { updatedAt: true },
  });

  const lastActivity = lastCopilot?.createdAt ?? userRow?.updatedAt ?? null;
  const daysSinceLastActivity =
    lastActivity != null
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  return {
    listingCount,
    copilotRunCount: copilotRuns,
    dealAnalysisCount,
    verifiedListingCount,
    hasActiveWorkspaceSubscription: Boolean(activeSub),
    daysSinceLastActivity,
  };
}

export async function scoreLeadForUser(
  db: PrismaClient,
  userId: string,
  options?: { emitAnalytics?: boolean }
): Promise<LeadScoreResult & { signals: LeadScoreSignals }> {
  const signals = await collectSignals(db, userId);
  const result = scoreLeadFromSignals(signals);
  if (options?.emitAnalytics) {
    captureServerEvent(userId, AnalyticsEvents.LEAD_SCORED, {
      score: result.score,
      category: result.category,
    });
  }
  return { ...result, signals };
}

export async function listTopLeads(
  db: PrismaClient,
  take: number
): Promise<{ userId: string; email: string | null; name: string | null; score: number; category: LeadScoreResult["category"] }[]> {
  const users = await db.user.findMany({
    take: Math.min(take * 5, 500),
    orderBy: { updatedAt: "desc" },
    select: { id: true, email: true, name: true },
  });

  const scored = await Promise.all(
    users.map(async (u) => {
      const r = await scoreLeadForUser(db, u.id);
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        score: r.score,
        category: r.category,
      };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, take);
}
