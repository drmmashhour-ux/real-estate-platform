import type { Prisma } from "@prisma/client";

import { prisma } from "@repo/db";

export type CentrisTopListingRow = {
  listingId: string;
  kind: "fsbo" | "crm";
  title: string;
  city: string | null;
  leadCount: number;
  avgScore: number;
};

export type CentrisFunnelAnalytics = {
  /** Window in days */
  days: number;
  /** Estimated listing touches from FUNNEL_VIEW on Centris leads */
  visitSignals: number;
  /** Captured leads (contacts) */
  captures: number;
  leadsWithSignup: number;
  conversionRate: number;
  /** Weak funnel steps by volume drop (heuristic labels) */
  weakSteps: string[];
  /** Best-performing CTA label by capture mix */
  bestCta: string | null;
  avgLeadScore: number | null;
};

function brokerLeadWhere(userId: string): Prisma.LeadWhereInput {
  return {
    distributionChannel: "CENTRIS",
    OR: [{ fsboListing: { ownerId: userId } }, { listing: { ownerId: userId } }],
  };
}

/**
 * Aggregates Centris funnel performance for broker dashboards — Lead + LeadTimelineEvent only.
 */
export async function getCentrisFunnelAnalyticsForBroker(userId: string, days: number): Promise<CentrisFunnelAnalytics> {
  const windowDays = Math.min(90, Math.max(1, days));
  const since = new Date(Date.now() - windowDays * 86400000);

  const baseWhere: Prisma.LeadWhereInput = {
    ...(await brokerLeadWhere(userId)),
    createdAt: { gte: since },
  };

  const leads = await prisma.lead.findMany({
    where: baseWhere,
    select: {
      id: true,
      score: true,
      pipelineStage: true,
      status: true,
      userId: true,
    },
  });

  const leadIds = leads.map((l) => l.id);
  const captures = leads.length;

  let viewCount = 0;
  const contactEvents: { payload: unknown }[] = [];

  if (leadIds.length > 0) {
    const [va, ce] = await Promise.all([
      prisma.leadTimelineEvent.aggregate({
        where: {
          leadId: { in: leadIds },
          eventType: "FUNNEL_VIEW",
        },
        _count: { _all: true },
      }),
      prisma.leadTimelineEvent.findMany({
        where: {
          leadId: { in: leadIds },
          eventType: "FUNNEL_CONTACT",
        },
        select: { payload: true },
      }),
    ]);
    viewCount = va._count._all;
    contactEvents.push(...ce);
  }

  const viewAgg = { _count: { _all: viewCount } };

  const intentMix: Record<string, number> = {};
  for (const ev of contactEvents) {
    const intent = (ev.payload as Record<string, unknown> | null)?.intent;
    const key = typeof intent === "string" ? intent : "unknown";
    intentMix[key] = (intentMix[key] ?? 0) + 1;
  }

  let bestCta: string | null = null;
  let bestN = 0;
  for (const [k, n] of Object.entries(intentMix)) {
    if (n > bestN) {
      bestN = n;
      bestCta = k === "unlock_analysis" ? "Unlock analysis" : k === "book_visit" ? "Book visit" : k === "download_report" ? "Download report" : k;
    }
  }

  const withUser = leads.filter((l) => l.userId != null).length;
  const conversionRate = captures > 0 ? Math.round((withUser / captures) * 1000) / 10 : 0;

  const avgLeadScore =
    leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : null;

  const staleNew = leads.filter((l) => (l.pipelineStage ?? "new") === "new").length;
  const weakSteps: string[] = [];
  if (captures > 0 && viewAgg._count._all / captures < 0.25) {
    weakSteps.push("Low repeat VIEW signals — add listing engagement tracking or remarketing.");
  }
  if (captures > 0 && staleNew / captures > 0.55) {
    weakSteps.push("High share stuck in `new` — tighten broker SLA / automation.");
  }
  if ((intentMix.unlock_analysis ?? 0) === 0 && captures > 2) {
    weakSteps.push("No unlock_analysis CTAs — test premium analysis strip placement.");
  }

  return {
    days: windowDays,
    visitSignals: viewAgg._count._all,
    captures,
    leadsWithSignup: withUser,
    conversionRate,
    weakSteps,
    bestCta,
    avgLeadScore,
  };
}

/** Broker dashboard snapshot: funnel analytics plus top-performing listing contexts by lead volume. */
export async function getCentrisBrokerDominationSnapshot(
  userId: string,
  days: number,
): Promise<{ analytics: CentrisFunnelAnalytics; topListings: CentrisTopListingRow[] }> {
  const analytics = await getCentrisFunnelAnalyticsForBroker(userId, days);
  const windowDays = Math.min(90, Math.max(1, days));
  const since = new Date(Date.now() - windowDays * 86400000);

  const baseWhere: Prisma.LeadWhereInput = {
    ...(await brokerLeadWhere(userId)),
    createdAt: { gte: since },
  };

  const rows = await prisma.lead.findMany({
    where: baseWhere,
    select: { fsboListingId: true, listingId: true, score: true },
  });

  const acc = new Map<string, { n: number; scoreSum: number }>();
  for (const r of rows) {
    const key = r.fsboListingId ?? r.listingId;
    if (!key) continue;
    const cur = acc.get(key) ?? { n: 0, scoreSum: 0 };
    cur.n++;
    cur.scoreSum += r.score;
    acc.set(key, cur);
  }

  const sorted = [...acc.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10);

  const topListings: CentrisTopListingRow[] = [];
  for (const [listingKey, v] of sorted) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: listingKey },
      select: { title: true, city: true },
    });
    if (fsbo) {
      topListings.push({
        listingId: listingKey,
        kind: "fsbo",
        title: fsbo.title,
        city: fsbo.city,
        leadCount: v.n,
        avgScore: Math.round(v.scoreSum / v.n),
      });
      continue;
    }
    const crm = await prisma.listing.findUnique({
      where: { id: listingKey },
      select: { title: true },
    });
    topListings.push({
      listingId: listingKey,
      kind: "crm",
      title: crm?.title ?? "CRM listing",
      city: null,
      leadCount: v.n,
      avgScore: Math.round(v.scoreSum / v.n),
    });
  }

  return { analytics, topListings };
}
