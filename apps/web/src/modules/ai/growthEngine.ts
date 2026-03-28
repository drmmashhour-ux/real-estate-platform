import { UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export type ChannelStat = { channel: string; leads: number };

/** Rank acquisition channels from CRM leads (source / medium fallback). */
export async function getBestChannels(days = 30, limit = 10): Promise<ChannelStat[]> {
  const since = subDays(new Date(), days);
  const rows = await prisma.lead.groupBy({
    by: ["source", "medium"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const merged = new Map<string, number>();
  for (const r of rows) {
    const src = (r.source ?? "direct").trim() || "direct";
    const med = (r.medium ?? "").trim();
    const label = med ? `${src} / ${med}` : src;
    merged.set(label, (merged.get(label) ?? 0) + r._count._all);
  }
  return [...merged.entries()]
    .map(([channel, leads]) => ({ channel, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);
}

export type ListingViewStat = { listingId: string; views: number; listingCode?: string | null };

/** Top FSBO / stay listings by LISTING_VIEW events in window. */
export async function getBestListings(sinceDays = 14, limit = 10): Promise<ListingViewStat[]> {
  const since = subDays(new Date(), sinceDays);
  const events = await prisma.userEvent.findMany({
    where: { eventType: UserEventType.LISTING_VIEW, createdAt: { gte: since } },
    select: { metadata: true },
    take: 8000,
  });
  const counts = new Map<string, number>();
  for (const e of events) {
    const m = e.metadata as { listingId?: string } | null;
    const id = m?.listingId?.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (!top.length) return [];
  const ids = top.map(([id]) => id);
  const [fsboRows, stayRows] = await Promise.all([
    prisma.fsboListing.findMany({
      where: { id: { in: ids } },
      select: { id: true, listingCode: true },
    }),
    prisma.shortTermListing.findMany({
      where: { id: { in: ids } },
      select: { id: true, listingCode: true },
    }),
  ]);
  const codeById = new Map<string, string | null>();
  for (const l of fsboRows) codeById.set(l.id, l.listingCode);
  for (const l of stayRows) codeById.set(l.id, l.listingCode);
  return top.map(([listingId, views]) => ({
    listingId,
    views,
    listingCode: codeById.get(listingId) ?? null,
  }));
}

export type PageViewStat = { path: string; views: number };

/** Top VISIT_PAGE targets from event metadata. */
export async function getBestPages(sinceDays = 14, limit = 12): Promise<PageViewStat[]> {
  const since = subDays(new Date(), sinceDays);
  const events = await prisma.userEvent.findMany({
    where: { eventType: UserEventType.VISIT_PAGE, createdAt: { gte: since } },
    select: { metadata: true },
    take: 6000,
  });
  const counts = new Map<string, number>();
  for (const e of events) {
    const m = e.metadata as { path?: string; url?: string } | null;
    const path = (m?.path ?? m?.url ?? "").trim() || "/";
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}
