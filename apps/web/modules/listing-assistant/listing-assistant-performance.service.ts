import { ListingAnalyticsKind, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getListingIdsForBroker } from "@/lib/broker/collaboration";

export type ListingAssistantPerformanceRow = {
  listingId: string;
  listingCode: string | null;
  title: string;
  firstAssistedAt: string | null;
  lastAssistedAt: string | null;
  versionCount: number;
  viewsTotal: number;
  contactClicks: number;
  demandScore: number | null;
  leadCount: number;
  /** contactClicks / max(1, viewsTotal) */
  conversionProxy: number;
};

/**
 * Best-effort outcome layer: assisted = has at least one `ListingAssistantContentVersion` row.
 */
export async function listAssistedListingPerformance(
  actorUserId: string,
  options: { isAdmin: boolean; take?: number } = {}
): Promise<ListingAssistantPerformanceRow[]> {
  const take = Math.min(options.take ?? 25, 100);
  const allowedIds =
    options.isAdmin ? null
    : (await getListingIdsForBroker(actorUserId));

  const whereVersions: Prisma.ListingAssistantContentVersionWhereInput =
    allowedIds ? { listingId: { in: allowedIds } } : {};

  const grouped = await prisma.listingAssistantContentVersion.groupBy({
    by: ["listingId"],
    where: whereVersions,
    _max: { createdAt: true },
  });
  const listingIds = grouped
    .sort((a, b) => (b._max.createdAt?.getTime() ?? 0) - (a._max.createdAt?.getTime() ?? 0))
    .map((g) => g.listingId)
    .slice(0, take);
  if (listingIds.length === 0) return [];

  const [listings, versionRows, analytics, leads] = await Promise.all([
    prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, listingCode: true, title: true },
    }),
    prisma.listingAssistantContentVersion.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, createdAt: true },
    }),
    prisma.listingAnalytics.findMany({
      where: {
        kind: ListingAnalyticsKind.CRM,
        listingId: { in: listingIds },
      },
    }),
    prisma.lecipmBrokerCrmLead.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds } },
      _count: { _all: true },
    }),
  ]);

  const vStats = new Map<string, { n: number; min: Date; max: Date }>();
  for (const r of versionRows) {
    const cur = vStats.get(r.listingId);
    if (!cur) {
      vStats.set(r.listingId, { n: 1, min: r.createdAt, max: r.createdAt });
    } else {
      cur.n += 1;
      if (r.createdAt < cur.min) cur.min = r.createdAt;
      if (r.createdAt > cur.max) cur.max = r.createdAt;
    }
  }

  const aMap = new Map(analytics.map((a) => [a.listingId, a]));
  const lMap = new Map(leads.map((l) => [l.listingId, l._count._all]));

  return listingIds
    .map((id) => {
      const l = listings.find((x) => x.id === id);
      if (!l) return null;
      const v = vStats.get(id);
      const a = aMap.get(id);
      const views = a?.viewsTotal ?? 0;
      const cc = a?.contactClicks ?? 0;
      return {
        listingId: id,
        listingCode: l.listingCode,
        title: l.title,
        firstAssistedAt: v?.min.toISOString() ?? null,
        lastAssistedAt: v?.max.toISOString() ?? null,
        versionCount: v?.n ?? 0,
        viewsTotal: views,
        contactClicks: cc,
        demandScore: a?.demandScore ?? null,
        leadCount: lMap.get(id) ?? 0,
        conversionProxy: Math.min(1, cc / Math.max(1, views)),
      } satisfies ListingAssistantPerformanceRow;
    })
    .filter((x): x is ListingAssistantPerformanceRow => x != null);
}

/**
 * Coarse benchmark: mean conversion proxy for recent non-assisted listings owned by broker (excluding assisted ids).
 * Assistive analytics only — not causal inference.
 */
export async function benchmarkNonAssistedConversionProxy(actorUserId: string, assistedIds: string[]): Promise<number | null> {
  const allowed = await getListingIdsForBroker(actorUserId);
  const filtered = allowed.filter((id) => !assistedIds.includes(id)).slice(0, 40);
  if (filtered.length === 0) return null;

  const analytics = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.CRM, listingId: { in: filtered } },
  });

  let sum = 0;
  let n = 0;
  for (const a of analytics) {
    const views = a.viewsTotal ?? 0;
    const cc = a.contactClicks ?? 0;
    sum += cc / Math.max(1, views);
    n++;
  }
  return n === 0 ? null : sum / n;
}
