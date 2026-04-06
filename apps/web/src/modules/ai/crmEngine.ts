import { PlatformRole, UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { assertBrokerCanReceiveNewLead } from "@/modules/billing/brokerLeadBilling";

export type IntentLevel = "cold" | "warm" | "hot";

function scoreToIntent(score: number): IntentLevel {
  if (score >= 70) return "hot";
  if (score >= 35) return "warm";
  return "cold";
}

/** Heuristic score from events, linked leads, and guest bookings (last 90d). */
export async function computeUserAutopilotScore(userId: string): Promise<{
  score: number;
  intentLevel: IntentLevel;
  breakdown: Record<string, number>;
}> {
  const since = subDays(new Date(), 90);
  const [events, leadCount, bookingCount] = await Promise.all([
    prisma.userEvent.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { eventType: true },
    }),
    prisma.lead.count({ where: { userId } }),
    prisma.booking.count({
      where: {
        guestId: userId,
        createdAt: { gte: since },
        status: {
          notIn: ["CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST", "DECLINED"],
        },
      },
    }),
  ]);

  let views = 0;
  let inquiries = 0;
  let payments = 0;
  for (const e of events) {
    if (e.eventType === UserEventType.LISTING_VIEW) views++;
    else if (e.eventType === UserEventType.INQUIRY) inquiries++;
    else if (e.eventType === UserEventType.PAYMENT_SUCCESS) payments++;
  }
  const viewPoints = Math.min(views, 30) * 2;
  const inquiryPoints = inquiries * 15;
  const paymentPoints = payments * 40;
  const leadPoints = Math.min(leadCount, 10) * 12;
  const bookingPoints = Math.min(bookingCount, 8) * 25;

  const score = Math.min(100, viewPoints + inquiryPoints + paymentPoints + leadPoints + bookingPoints);
  return {
    score,
    intentLevel: scoreToIntent(score),
    breakdown: {
      viewPoints,
      inquiryPoints,
      paymentPoints,
      leadPoints,
      bookingPoints,
    },
  };
}

/** Upsert `user_scores` and mirror into `user_ai_profiles` for existing dashboards. */
export async function upsertUserScoreRow(userId: string) {
  const { score, intentLevel, breakdown } = await computeUserAutopilotScore(userId);
  const ext = prisma as unknown as {
    userScore?: { upsert: (args: object) => Promise<unknown> };
  };
  if (ext.userScore) {
    await ext.userScore.upsert({
      where: { userId },
      create: { userId, score, intentLevel, breakdown },
      update: { score, intentLevel, breakdown },
    });
  }
  await prisma.userAiProfile.upsert({
    where: { userId },
    create: {
      userId,
      behaviorLeadScore: score,
      behaviorTier: intentLevel,
      scoreBreakdown: breakdown,
    },
    update: {
      behaviorLeadScore: score,
      behaviorTier: intentLevel,
      scoreBreakdown: breakdown,
    },
  });
  return { userId, score, intentLevel };
}

/** Recompute scores for active users (events or leads in the window). */
export async function refreshUserScoresBatch(limit = 200): Promise<{ updated: number }> {
  const since = subDays(new Date(), 90);
  const fromEvents = await prisma.userEvent.findMany({
    where: { userId: { not: null }, createdAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
    take: limit,
  });
  const fromLeads = await prisma.lead.findMany({
    where: { userId: { not: null }, createdAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
    take: limit,
  });
  const ids = new Set<string>();
  for (const r of fromEvents) {
    if (r.userId) ids.add(r.userId);
  }
  for (const r of fromLeads) {
    if (r.userId) ids.add(r.userId);
  }
  let updated = 0;
  for (const userId of ids) {
    await upsertUserScoreRow(userId);
    updated++;
  }
  return { updated };
}

/** Assign unassigned CRM leads to the least-loaded active broker. */
export async function autoAssignLeads(take = 25): Promise<{ assigned: number }> {
  const brokers = await prisma.user.findMany({
    where: { role: PlatformRole.BROKER, accountStatus: "ACTIVE" },
    select: {
      id: true,
      _count: { select: { introducedLeads: true } },
    },
    orderBy: { introducedLeads: { _count: "asc" } },
    take: 20,
  });
  if (!brokers.length) return { assigned: 0 };

  const unassigned = await prisma.lead.findMany({
    where: {
      introducedByBrokerId: null,
      pipelineStatus: "new",
      mortgageMarketplaceStatus: null,
      OR: [{ listingId: { not: null } }, { fsboListingId: { not: null } }, { shortTermListingId: { not: null } }],
    },
    select: { id: true },
    take,
    orderBy: { createdAt: "asc" },
  });

  let assigned = 0;
  let i = 0;
  for (const lead of unassigned) {
    let placed = false;
    for (let k = 0; k < brokers.length; k++) {
      const broker = brokers[(i + k) % brokers.length]!;
      const gate = await assertBrokerCanReceiveNewLead(prisma, broker.id);
      if (!gate.ok) continue;
      await prisma.lead.update({
        where: { id: lead.id },
        data: { introducedByBrokerId: broker.id },
      });
      i += k + 1;
      assigned++;
      placed = true;
      break;
    }
    if (!placed) break;
  }
  return { assigned };
}

/** Queue follow-up automation events for stale high-intent leads (no follow-up logged). */
export async function autoFollowUpHighIntentLeads(take = 30): Promise<{ queued: number }> {
  const cutoff = subDays(new Date(), 3);
  const leads = await prisma.lead.findMany({
    where: {
      score: { gte: 45 },
      lastFollowUpAt: null,
      optedOutOfFollowUp: false,
      pipelineStatus: { in: ["new", "contacted"] },
      createdAt: { lte: cutoff },
      introducedByBrokerId: { not: null },
    },
    select: { id: true, userId: true, introducedByBrokerId: true },
    take,
    orderBy: { createdAt: "asc" },
  });

  let queued = 0;
  for (const lead of leads) {
    await prisma.aiAutomationEvent.create({
      data: {
        userId: lead.userId,
        brokerId: lead.introducedByBrokerId,
        eventKey: "follow_up_reminder",
        payload: { leadId: lead.id, source: "crm_autopilot" },
      },
    });
    queued++;
  }
  return { queued };
}

/** Single cron-friendly sweep: scores + assignment + follow-up hints. */
export async function runCrmAutopilotSweep() {
  const [scores, assign, followUps] = await Promise.all([
    refreshUserScoresBatch(200),
    autoAssignLeads(25),
    autoFollowUpHighIntentLeads(30),
  ]);
  return { scores, assign, followUps };
}
