/**
 * Marketing performance signals — stored in `MarketingSystemEvent` (category PERFORMANCE).
 * Amounts are explicit (spend/revenue) — never fabricated.
 */
import { MarketingSystemEventCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Used by activation + `/api/marketing-system/v2/events` to avoid duplicate performance rows. */
export async function hasPerformanceIdempotencyKey(key: string): Promise<boolean> {
  const row = await prisma.marketingSystemEvent.findFirst({
    where: {
      category: MarketingSystemEventCategory.PERFORMANCE,
      meta: { path: ["idempotencyKey"], equals: key },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function recordPerformanceEvent(input: {
  userId?: string | null;
  eventKey: "impression" | "click" | "lead" | "booking" | "revenue" | "spend" | string;
  subjectType?: "campaign" | "listing" | "blog" | "studio" | null;
  subjectId?: string | null;
  amountCents?: number | null;
  sessionId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  const metaObj = input.meta && typeof input.meta === "object" && input.meta !== null ? input.meta : null;
  const idem =
    metaObj && "idempotencyKey" in metaObj && typeof (metaObj as { idempotencyKey?: unknown }).idempotencyKey === "string"
      ? (metaObj as { idempotencyKey: string }).idempotencyKey
      : null;
  if (idem && (await hasPerformanceIdempotencyKey(idem))) {
    const existing = await prisma.marketingSystemEvent.findFirst({
      where: {
        category: MarketingSystemEventCategory.PERFORMANCE,
        meta: { path: ["idempotencyKey"], equals: idem },
      },
    });
    if (existing) return existing;
  }

  return prisma.marketingSystemEvent.create({
    data: {
      userId: input.userId ?? null,
      category: MarketingSystemEventCategory.PERFORMANCE,
      eventKey: input.eventKey,
      subjectType: input.subjectType ?? null,
      subjectId: input.subjectId ?? null,
      amountCents: input.amountCents ?? null,
      sessionId: input.sessionId ?? null,
      meta: input.meta ?? undefined,
    },
  });
}

export async function aggregatePerformanceForUser(userId: string, since: Date) {
  const rows = await prisma.marketingSystemEvent.findMany({
    where: {
      userId,
      category: MarketingSystemEventCategory.PERFORMANCE,
      createdAt: { gte: since },
    },
    select: { eventKey: true, amountCents: true },
  });
  const amountByKey: Record<string, number> = {};
  let impressions = 0;
  let clicks = 0;
  for (const r of rows) {
    if (r.eventKey === "impression") impressions += 1;
    if (r.eventKey === "click") clicks += 1;
    if (r.amountCents != null && r.amountCents !== 0) {
      amountByKey[r.eventKey] = (amountByKey[r.eventKey] ?? 0) + r.amountCents;
    }
  }
  return { eventCount: rows.length, impressions, clicks, amountByKey };
}
