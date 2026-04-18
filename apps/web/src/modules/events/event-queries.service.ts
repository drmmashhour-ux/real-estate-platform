import { prisma } from "@/lib/db";

export async function countEventsByType(params: {
  eventTypes: string[];
  since: Date;
  until?: Date;
}): Promise<Record<string, number>> {
  const until = params.until ?? new Date();
  const rows = await prisma.eventLog.groupBy({
    by: ["eventType"],
    where: {
      eventType: { in: params.eventTypes },
      createdAt: { gte: params.since, lte: until },
    },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) out[r.eventType] = r._count._all;
  return out;
}

export async function countEventsForListing(listingId: string, eventType: string, since: Date): Promise<number> {
  return prisma.eventLog.count({
    where: { listingId, eventType, createdAt: { gte: since } },
  });
}

export async function recentSessionEvents(sessionId: string, limit: number): Promise<
  { eventType: string; listingId: string | null; createdAt: Date }[]
> {
  return prisma.eventLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { eventType: true, listingId: true, createdAt: true },
  });
}
