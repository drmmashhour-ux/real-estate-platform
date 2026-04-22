import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { DAILY_CATEGORY_CAPS, POINT_VALUES, complianceQualityScore } from "@/modules/gamification/broker-gamification-policy";
import type { PointCategory } from "@/modules/gamification/broker-gamification.types";

export async function sumPointsSince(brokerId: string, since: Date | null): Promise<number> {
  const rows = await prisma.brokerPointsLedger.aggregate({
    where: {
      brokerId,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { points: true },
  });
  return rows._sum.points ?? 0;
}

export async function sumPointsTotal(brokerId: string): Promise<number> {
  return sumPointsSince(brokerId, null);
}

export async function categoryPointsToday(brokerId: string, category: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const row = await prisma.brokerPointsLedger.aggregate({
    where: { brokerId, category, createdAt: { gte: start }, points: { gt: 0 } },
    _sum: { points: true },
  });
  return row._sum.points ?? 0;
}

/** Idempotent awards with daily category caps — never for raw volume spam. */
export async function awardPoints(args: {
  brokerId: string;
  points: number;
  reason: string;
  category: PointCategory;
  dedupeKey?: string | null;
}): Promise<{ ok: boolean; skipped?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: args.brokerId },
    select: { role: true },
  });
  if (!user || user.role !== PlatformRole.BROKER) return { ok: false, skipped: "not_broker" };

  if (args.points > 0) {
    const cap = DAILY_CATEGORY_CAPS[args.category];
    if (cap != null) {
      const today = await categoryPointsToday(args.brokerId, args.category);
      if (today + args.points > cap) return { ok: false, skipped: "daily_cap" };
    }
  }

  try {
    await prisma.brokerPointsLedger.create({
      data: {
        brokerId: args.brokerId,
        points: args.points,
        reason: args.reason.slice(0, 160),
        category: args.category,
        dedupeKey: args.dedupeKey?.slice(0, 160) ?? null,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, skipped: "dedupe_or_db" };
  }
}

export async function logGamificationEvent(brokerId: string, eventType: string, payload?: Record<string, unknown>) {
  await prisma.brokerGamificationEvent.create({
    data: {
      brokerId,
      eventType,
      payloadJson: payload ?? {},
    },
  });
}
