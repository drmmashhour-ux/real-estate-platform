import { prisma } from "@/lib/db";
import type { UserEventType } from "@prisma/client";

const FUNNEL: UserEventType[] = ["LISTING_VIEW", "SIGNUP", "INQUIRY", "PAYMENT_SUCCESS"];

export async function getFunnelCounts(since: Date) {
  const rows = await prisma.userEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since }, eventType: { in: FUNNEL } },
    _count: { id: true },
  });
  const map = new Map(rows.map((r) => [r.eventType, r._count.id]));
  return FUNNEL.map((eventType) => ({
    eventType,
    count: map.get(eventType) ?? 0,
  }));
}

export async function getEventsOverTime(since: Date, bucketDays = 1) {
  const events = await prisma.userEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { eventType: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const bucketMs = bucketDays * 24 * 60 * 60 * 1000;
  const buckets = new Map<string, number>();
  for (const e of events) {
    const t = Math.floor(e.createdAt.getTime() / bucketMs) * bucketMs;
    const key = new Date(t).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export function conversionRates(funnel: { eventType: string; count: number }[]) {
  const by = (t: string) => funnel.find((f) => f.eventType === t)?.count ?? 0;
  const views = by("LISTING_VIEW") || 1;
  const signups = by("SIGNUP");
  const inquiries = by("INQUIRY");
  const payments = by("PAYMENT_SUCCESS");
  return {
    signupRate: Math.round((signups / views) * 1000) / 10,
    leadRate: Math.round((inquiries / Math.max(signups, 1)) * 1000) / 10,
    paymentRate: Math.round((payments / Math.max(inquiries, 1)) * 1000) / 10,
  };
}
