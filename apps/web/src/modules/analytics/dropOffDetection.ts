/**
 * Heuristic drop-off signals from `user_events` (post-hoc, dashboard use).
 */
import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const MS_5M = 5 * 60 * 1000;
const MS_10M = 10 * 60 * 1000;

export type PropertyDropOffRow = {
  userId: string;
  viewedAt: Date;
  listingId: string | null;
  label: "PROPERTY DROP-OFF";
};

export type CheckoutDropOffRow = {
  userId: string;
  checkoutAt: Date;
  label: "CHECKOUT DROP-OFF";
};

export async function detectPropertyDropOffs(limit = 25): Promise<PropertyDropOffRow[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const views = await prisma.userEvent.findMany({
    where: {
      eventType: UserEventType.LISTING_VIEW,
      createdAt: { gte: since },
      userId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: { userId: true, createdAt: true, metadata: true },
  });

  const out: PropertyDropOffRow[] = [];
  const seen = new Set<string>();

  for (const v of views) {
    if (!v.userId || seen.has(v.userId)) continue;
    const until = new Date(v.createdAt.getTime() + MS_5M);
    const inquiry = await prisma.userEvent.findFirst({
      where: {
        userId: v.userId,
        eventType: UserEventType.INQUIRY,
        createdAt: { gte: v.createdAt, lte: until },
      },
      select: { id: true },
    });
    if (inquiry) continue;
    const meta = v.metadata as Record<string, unknown> | null;
    const listingId = typeof meta?.listingId === "string" ? meta.listingId : null;
    out.push({
      userId: v.userId,
      viewedAt: v.createdAt,
      listingId,
      label: "PROPERTY DROP-OFF",
    });
    seen.add(v.userId);
    if (out.length >= limit) break;
  }
  return out;
}

export async function detectCheckoutDropOffs(limit = 25): Promise<CheckoutDropOffRow[]> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const checkouts = await prisma.userEvent.findMany({
    where: {
      eventType: UserEventType.CHECKOUT_START,
      createdAt: { gte: since },
      userId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: { userId: true, createdAt: true },
  });

  const out: CheckoutDropOffRow[] = [];
  const seen = new Set<string>();

  for (const c of checkouts) {
    if (!c.userId || seen.has(`${c.userId}:${c.createdAt.toISOString()}`)) continue;
    const until = new Date(c.createdAt.getTime() + MS_10M);
    const paid = await prisma.userEvent.findFirst({
      where: {
        userId: c.userId,
        eventType: UserEventType.PAYMENT_SUCCESS,
        createdAt: { gte: c.createdAt, lte: until },
      },
      select: { id: true },
    });
    if (paid) continue;
    out.push({ userId: c.userId, checkoutAt: c.createdAt, label: "CHECKOUT DROP-OFF" });
    seen.add(`${c.userId}:${c.createdAt.toISOString()}`);
    if (out.length >= limit) break;
  }
  return out;
}

export async function funnelCountsSince(since: Date): Promise<Record<string, number>> {
  const types = [
    UserEventType.SEARCH_PERFORMED,
    UserEventType.LISTING_VIEW,
    UserEventType.INQUIRY,
    UserEventType.BOOKING_START,
    UserEventType.CHECKOUT_START,
    UserEventType.PAYMENT_SUCCESS,
  ] as const;
  const rows = await prisma.userEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since }, eventType: { in: [...types] } },
    _count: { id: true },
  });
  const map: Record<string, number> = {};
  for (const t of types) map[t] = 0;
  for (const r of rows) {
    map[r.eventType] = r._count.id;
  }
  return map;
}
