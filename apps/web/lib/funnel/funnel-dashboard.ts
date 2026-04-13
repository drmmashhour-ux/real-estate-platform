import type { AnalyticsFunnelEventName } from "@prisma/client";
import { prisma } from "@/lib/db";

const STEPS: AnalyticsFunnelEventName[] = [
  "listing_view",
  "contact_click",
  "visit_request",
  "visit_confirmed",
  "deal_started",
  "payment_completed",
];

export type FunnelSnapshot = {
  since: string;
  counts: Record<AnalyticsFunnelEventName, number>;
  rates: { from: AnalyticsFunnelEventName; to: AnalyticsFunnelEventName; pct: number | null }[];
  dropOffs: { step: string; lost: number; pctOfPrior: number | null }[];
  topListingsByContact: Array<{ listingId: string; contacts: number; views: number }>;
  abListingViewToContact: { variant: string | null; views: number; contacts: number; ratePct: number | null }[];
  retargeting: {
    viewedNoContactPairs: number;
    contactedNoVisitPairs: number;
    visitedNoDealPairs: number;
  };
};

function pct(n: number, d: number): number | null {
  if (d <= 0) return null;
  return Math.round((n / d) * 1000) / 10;
}

export async function getFunnelSnapshot(days = 30): Promise<FunnelSnapshot> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const grouped = await prisma.analyticsFunnelEvent.groupBy({
    by: ["name"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  const counts = {} as Record<AnalyticsFunnelEventName, number>;
  for (const s of STEPS) counts[s] = 0;
  for (const row of grouped) {
    counts[row.name] = row._count.id;
  }

  const rates: FunnelSnapshot["rates"] = [];
  for (let i = 0; i < STEPS.length - 1; i++) {
    const from = STEPS[i]!;
    const to = STEPS[i + 1]!;
    rates.push({
      from,
      to,
      pct: pct(counts[to], counts[from]),
    });
  }

  const dropOffs: FunnelSnapshot["dropOffs"] = [];
  for (let i = 0; i < STEPS.length - 1; i++) {
    const prior = STEPS[i]!;
    const next = STEPS[i + 1]!;
    const lost = Math.max(0, counts[prior] - counts[next]);
    dropOffs.push({
      step: `${prior} → ${next}`,
      lost,
      pctOfPrior: counts[prior] > 0 ? pct(lost, counts[prior]) : null,
    });
  }

  const contactsByListing = await prisma.analyticsFunnelEvent.groupBy({
    by: ["listingId"],
    where: { name: "contact_click", createdAt: { gte: since }, listingId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 15,
  });

  const topListingsByContact: FunnelSnapshot["topListingsByContact"] = [];
  for (const row of contactsByListing) {
    if (!row.listingId) continue;
    const views = await prisma.analyticsFunnelEvent.count({
      where: {
        name: "listing_view",
        listingId: row.listingId,
        createdAt: { gte: since },
      },
    });
    topListingsByContact.push({
      listingId: row.listingId,
      contacts: row._count.id,
      views,
    });
  }

  const byVar = new Map<string | null, { view: number; contact: number }>();
  const viewsByVar = await prisma.analyticsFunnelEvent.groupBy({
    by: ["variant"],
    where: { name: "listing_view", createdAt: { gte: since } },
    _count: { id: true },
  });
  const contactByVar = await prisma.analyticsFunnelEvent.groupBy({
    by: ["variant"],
    where: { name: "contact_click", createdAt: { gte: since } },
    _count: { id: true },
  });
  for (const v of viewsByVar) {
    const k = v.variant ?? null;
    const cur = byVar.get(k) ?? { view: 0, contact: 0 };
    cur.view = v._count.id;
    byVar.set(k, cur);
  }
  for (const v of contactByVar) {
    const k = v.variant ?? null;
    const cur = byVar.get(k) ?? { view: 0, contact: 0 };
    cur.contact = v._count.id;
    byVar.set(k, cur);
  }

  const abListingViewToContact: FunnelSnapshot["abListingViewToContact"] = [];
  for (const [variant, { view, contact }] of byVar) {
    abListingViewToContact.push({
      variant,
      views: view,
      contacts: contact,
      ratePct: pct(contact, view),
    });
  }

  const viewedNoContactPairs = await prisma.$queryRaw<[{ c: bigint }]>`
    WITH v AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'listing_view' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    ),
    c AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'contact_click' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    )
    SELECT COUNT(*)::bigint AS c FROM v
    LEFT JOIN c ON v.listing_id = c.listing_id AND v.user_id = c.user_id
    WHERE c.listing_id IS NULL
  `;

  const contactedNoVisitPairs = await prisma.$queryRaw<[{ c: bigint }]>`
    WITH c AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'contact_click' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    ),
    vr AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'visit_request' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    )
    SELECT COUNT(*)::bigint AS c FROM c
    LEFT JOIN vr ON c.listing_id = vr.listing_id AND c.user_id = vr.user_id
    WHERE vr.listing_id IS NULL
  `;

  const visitedNoDealPairs = await prisma.$queryRaw<[{ c: bigint }]>`
    WITH vc AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'visit_confirmed' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    ),
    d AS (
      SELECT DISTINCT "listing_id", "user_id" FROM "analytics_events"
      WHERE "name" = 'deal_started' AND "created_at" >= ${since}
        AND "listing_id" IS NOT NULL AND "user_id" IS NOT NULL
    )
    SELECT COUNT(*)::bigint AS c FROM vc
    LEFT JOIN d ON vc.listing_id = d.listing_id AND vc.user_id = d.user_id
    WHERE d.listing_id IS NULL
  `;

  return {
    since: since.toISOString(),
    counts,
    rates,
    dropOffs,
    topListingsByContact,
    abListingViewToContact,
    retargeting: {
      viewedNoContactPairs: Number(viewedNoContactPairs[0]?.c ?? 0),
      contactedNoVisitPairs: Number(contactedNoVisitPairs[0]?.c ?? 0),
      visitedNoDealPairs: Number(visitedNoDealPairs[0]?.c ?? 0),
    },
  };
}
