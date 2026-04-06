import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const REVENUE_EVENT_TYPES = {
  booking_completed: "booking_completed",
  lead_purchased: "lead_purchased",
  premium_upgrade: "premium_upgrade",
} as const;

export const REVENUE_OPPORTUNITY_TYPES = {
  booking: "booking",
  broker_lead: "broker_lead",
  premium_listing: "premium_listing",
} as const;

export const REVENUE_OPPORTUNITY_STATUS = {
  open: "open",
  converted: "converted",
  lost: "lost",
} as const;

const BOOKING_OPP_VALUE = 85;
const PREMIUM_LISTING_OPP_VALUE = 199;

export async function recordRevenueEvent(args: {
  userId: string | null;
  eventType: string;
  amount: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.revenueEvent.create({
    data: {
      userId: args.userId ?? undefined,
      eventType: args.eventType,
      amount: args.amount,
      metadataJson: args.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function recordBookingCompletedRevenue(args: {
  guestUserId: string;
  bookingId: string;
  totalCents: number;
  guestFeeCents: number;
  hostFeeCents: number;
  listingId: string;
}): Promise<void> {
  const platformFeesCents = args.guestFeeCents + args.hostFeeCents;
  const amount = platformFeesCents > 0 ? platformFeesCents / 100 : args.totalCents / 100;
  await recordRevenueEvent({
    userId: args.guestUserId,
    eventType: REVENUE_EVENT_TYPES.booking_completed,
    amount,
    metadata: {
      bookingId: args.bookingId,
      listingId: args.listingId,
      totalCents: args.totalCents,
      guestFeeCents: args.guestFeeCents,
      hostFeeCents: args.hostFeeCents,
    },
  });
  await prisma.revenueOpportunity.updateMany({
    where: {
      userId: args.guestUserId,
      opportunityType: REVENUE_OPPORTUNITY_TYPES.booking,
      status: REVENUE_OPPORTUNITY_STATUS.open,
    },
    data: { status: REVENUE_OPPORTUNITY_STATUS.converted },
  });
}

export async function recordLeadPurchasedRevenue(args: {
  buyerUserId: string;
  leadId: string;
  amount: number;
  marketplaceListingId?: string;
}): Promise<void> {
  await recordRevenueEvent({
    userId: args.buyerUserId,
    eventType: REVENUE_EVENT_TYPES.lead_purchased,
    amount: args.amount,
    metadata: {
      leadId: args.leadId,
      marketplaceListingId: args.marketplaceListingId,
    },
  });
  await prisma.revenueOpportunity.updateMany({
    where: {
      leadId: args.leadId,
      opportunityType: REVENUE_OPPORTUNITY_TYPES.broker_lead,
      status: REVENUE_OPPORTUNITY_STATUS.open,
    },
    data: { status: REVENUE_OPPORTUNITY_STATUS.converted },
  });
}

export async function recordPremiumUpgradeRevenue(args: {
  userId: string;
  amount: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordRevenueEvent({
    userId: args.userId,
    eventType: REVENUE_EVENT_TYPES.premium_upgrade,
    amount: args.amount,
    metadata: args.metadata,
  });
}

async function upsertOpenOpportunity(args: {
  userId: string;
  leadId: string | null;
  opportunityType: string;
  valueEstimate: number;
}): Promise<void> {
  const existing = await prisma.revenueOpportunity.findFirst({
    where: {
      userId: args.userId,
      opportunityType: args.opportunityType,
      leadId: args.leadId,
      status: REVENUE_OPPORTUNITY_STATUS.open,
    },
  });
  if (existing) {
    await prisma.revenueOpportunity.update({
      where: { id: existing.id },
      data: { valueEstimate: args.valueEstimate },
    });
    return;
  }
  await prisma.revenueOpportunity.create({
    data: {
      userId: args.userId,
      leadId: args.leadId ?? undefined,
      opportunityType: args.opportunityType,
      status: REVENUE_OPPORTUNITY_STATUS.open,
      valueEstimate: args.valueEstimate,
    },
  });
}

function estimateBrokerLeadValue(lead: {
  dynamicLeadPriceCents: number | null;
  estimatedValue: number | null;
  dealValue: number | null;
}): number {
  if (lead.dynamicLeadPriceCents != null && lead.dynamicLeadPriceCents > 0) {
    return Math.min(5000, lead.dynamicLeadPriceCents / 100);
  }
  if (lead.estimatedValue != null && lead.estimatedValue > 0) {
    return Math.min(5000, lead.estimatedValue / 100);
  }
  if (lead.dealValue != null && lead.dealValue > 0) {
    return Math.min(5000, lead.dealValue / 100);
  }
  return 250;
}

/**
 * Align opportunities with CRM execution stage + intent (call after execution layer refresh).
 */
export async function syncRevenueOpportunitiesForLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      userId: true,
      executionStage: true,
      intentScore: true,
      shortTermListingId: true,
      dynamicLeadPriceCents: true,
      estimatedValue: true,
      dealValue: true,
      lostAt: true,
    },
  });
  if (!lead?.userId) return;

  if (lead.lostAt || lead.executionStage === "lost") {
    await prisma.revenueOpportunity.updateMany({
      where: { leadId, status: REVENUE_OPPORTUNITY_STATUS.open },
      data: { status: REVENUE_OPPORTUNITY_STATUS.lost },
    });
    return;
  }

  const st = lead.executionStage;

  if (st === "browsing" || st === "viewing_property") {
    await upsertOpenOpportunity({
      userId: lead.userId,
      leadId: lead.id,
      opportunityType: REVENUE_OPPORTUNITY_TYPES.booking,
      valueEstimate: BOOKING_OPP_VALUE + Math.min(40, lead.intentScore * 0.25),
    });
  }

  if (st === "inquiry_sent" || st === "broker_connected" || st === "booking_started" || st === "negotiation") {
    await upsertOpenOpportunity({
      userId: lead.userId,
      leadId: lead.id,
      opportunityType: REVENUE_OPPORTUNITY_TYPES.broker_lead,
      valueEstimate: estimateBrokerLeadValue(lead),
    });
  }

  if (lead.shortTermListingId) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: lead.shortTermListingId },
      select: { ownerId: true, listingStatus: true },
    });
    if (listing && listing.ownerId === lead.userId && listing.listingStatus === "PUBLISHED") {
      await upsertOpenOpportunity({
        userId: lead.userId,
        leadId: lead.id,
        opportunityType: REVENUE_OPPORTUNITY_TYPES.premium_listing,
        valueEstimate: PREMIUM_LISTING_OPP_VALUE,
      });
    }
  }
}

export type RevenuePushAction = { key: string; label: string; reason: string };

export function getRevenuePushActionsForLead(executionStage: string): RevenuePushAction[] {
  const actions: RevenuePushAction[] = [];
  if (executionStage === "viewing_property" || executionStage === "browsing") {
    actions.push({
      key: "push_booking",
      label: "Push booking",
      reason: "Guest is browsing — convert to a stay booking.",
    });
  }
  if (executionStage === "inquiry_sent" || executionStage === "broker_connected") {
    actions.push({
      key: "encourage_lead_purchase",
      label: "Encourage lead purchase / unlock",
      reason: "Serious inquiry — broker monetization window.",
    });
  }
  if (executionStage === "booking_started" || executionStage === "negotiation") {
    actions.push({
      key: "upsell_premium_listing",
      label: "Upsell premium listing / host tools",
      reason: "High intent — expand host or listing revenue.",
    });
  }
  return actions;
}

export type TopRevenueUserRow = {
  userId: string;
  email: string | null;
  name: string | null;
  compositeScore: number;
  priorityScore: number;
  openOpportunityValue: number;
  realizedRevenue30d: number;
};

export async function getTopRevenueUsers(limit = 15): Promise<TopRevenueUserRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [openByUser, realizedByUser, leadScores] = await Promise.all([
    prisma.revenueOpportunity.groupBy({
      by: ["userId"],
      where: { status: REVENUE_OPPORTUNITY_STATUS.open, userId: { not: null } },
      _sum: { valueEstimate: true },
    }),
    prisma.revenueEvent.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.lead.findMany({
      where: { userId: { not: null }, executionStage: { notIn: ["lost", "closed"] } },
      select: { userId: true, priorityScore: true },
    }),
  ]);

  const openMap = new Map<string, number>();
  for (const row of openByUser) {
    if (row.userId) openMap.set(row.userId, row._sum.valueEstimate ?? 0);
  }
  const realizedMap = new Map<string, number>();
  for (const row of realizedByUser) {
    if (row.userId) realizedMap.set(row.userId, row._sum.amount ?? 0);
  }
  const priorityByUser = new Map<string, number>();
  for (const l of leadScores) {
    if (!l.userId) continue;
    const prev = priorityByUser.get(l.userId) ?? 0;
    if (l.priorityScore > prev) priorityByUser.set(l.userId, l.priorityScore);
  }

  const userIds = new Set<string>([...openMap.keys(), ...realizedMap.keys(), ...priorityByUser.keys()]);
  if (userIds.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, email: true, name: true },
    take: 200,
  });

  const rows: TopRevenueUserRow[] = users.map((u) => {
    const openV = openMap.get(u.id) ?? 0;
    const realized = realizedMap.get(u.id) ?? 0;
    const pri = priorityByUser.get(u.id) ?? 0;
    const compositeScore = pri + openV * 0.12 + realized * 0.08;
    return {
      userId: u.id,
      email: u.email,
      name: u.name,
      compositeScore,
      priorityScore: pri,
      openOpportunityValue: openV,
      realizedRevenue30d: realized,
    };
  });

  rows.sort((a, b) => b.compositeScore - a.compositeScore);
  return rows.slice(0, limit);
}

export type RevenueEngineDashboardStats = {
  revenueToday: number;
  eventsTodayByType: Record<string, number>;
  openOpportunities: number;
  convertedLast30d: number;
  lostLast30d: number;
  opportunityConversionRate: number;
};

export async function getRevenueEngineDashboardStats(): Promise<RevenueEngineDashboardStats> {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [eventsToday, openCount, converted30, lost30] = await Promise.all([
    prisma.revenueEvent.findMany({
      where: { createdAt: { gte: startOfDay } },
      select: { eventType: true, amount: true },
    }),
    prisma.revenueOpportunity.count({ where: { status: REVENUE_OPPORTUNITY_STATUS.open } }),
    prisma.revenueOpportunity.count({
      where: {
        status: REVENUE_OPPORTUNITY_STATUS.converted,
        updatedAt: { gte: since30 },
      },
    }),
    prisma.revenueOpportunity.count({
      where: { status: REVENUE_OPPORTUNITY_STATUS.lost, updatedAt: { gte: since30 } },
    }),
  ]);

  const revenueToday = eventsToday.reduce((s, e) => s + e.amount, 0);
  const eventsTodayByType: Record<string, number> = {};
  for (const e of eventsToday) {
    eventsTodayByType[e.eventType] = (eventsTodayByType[e.eventType] ?? 0) + 1;
  }

  const denom = converted30 + lost30;
  const opportunityConversionRate = denom > 0 ? converted30 / denom : 0;

  return {
    revenueToday,
    eventsTodayByType,
    openOpportunities: openCount,
    convertedLast30d: converted30,
    lostLast30d: lost30,
    opportunityConversionRate,
  };
}

export async function getLeadRevenueSnapshot(leadId: string): Promise<{
  openOpportunityValue: number;
  pushActions: RevenuePushAction[];
}> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { executionStage: true },
  });
  if (!lead) return { openOpportunityValue: 0, pushActions: [] };

  const agg = await prisma.revenueOpportunity.aggregate({
    where: { leadId, status: REVENUE_OPPORTUNITY_STATUS.open },
    _sum: { valueEstimate: true },
  });

  return {
    openOpportunityValue: agg._sum.valueEstimate ?? 0,
    pushActions: getRevenuePushActionsForLead(lead.executionStage),
  };
}

/** Test helpers — pure simulation of opportunity values from context. */
export function simulateBookingOpportunityValue(intentScore: number): number {
  return BOOKING_OPP_VALUE + Math.min(40, intentScore * 0.25);
}

export function simulateInquiryBrokerValue(dynamicLeadPriceCents: number | null): number {
  return estimateBrokerLeadValue({
    dynamicLeadPriceCents,
    estimatedValue: null,
    dealValue: null,
  });
}

export function simulatePremiumListingValue(): number {
  return PREMIUM_LISTING_OPP_VALUE;
}
