import { buildRetargetingAudiences } from "./retargeting-audience.service";
import { prisma } from "@/lib/db";

export type RetargetingAudienceSummary = {
  count: number;
  lastActivity: string | null;
  label: string;
};

/**
 * Lightweight audience labels for ads scaling + retargeting planning.
 */
export async function getRetargetingAudiences(rangeDays: number): Promise<{
  audience_visitors: RetargetingAudienceSummary;
  audience_engaged: RetargetingAudienceSummary;
  audience_hot: RetargetingAudienceSummary;
}> {
  const audiences = await buildRetargetingAudiences(rangeDays);
  const since = new Date(Date.now() - rangeDays * 864e5);

  const clickedUsers = await prisma.growthEvent.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: since },
      eventName: "cta_click",
      userId: { not: null },
    },
    _count: { _all: true },
  });
  const clickIds = clickedUsers.map((c) => c.userId!).filter(Boolean);

  let hotCount = 0;
  if (clickIds.length > 0) {
    const booked = await prisma.growthEvent.findMany({
      where: {
        userId: { in: clickIds },
        createdAt: { gte: since },
        eventName: "booking_completed",
      },
      distinct: ["userId"],
      select: { userId: true },
    });
    const bookedSet = new Set(booked.map((b) => b.userId!));
    hotCount = clickIds.filter((id) => !bookedSet.has(id)).length;
  }

  const lastHot = await prisma.growthEvent.aggregate({
    where: {
      createdAt: { gte: since },
      eventName: "cta_click",
      userId: { not: null },
    },
    _max: { createdAt: true },
  });

  return {
    audience_visitors: {
      count: audiences.visitors.count + (audiences.visitors.anonymousSessions ?? 0),
      lastActivity: audiences.visitors.lastActivity,
      label: "Landing/page views (incl. anonymous sessions)",
    },
    audience_engaged: {
      count: audiences.engaged.count,
      lastActivity: audiences.engaged.lastActivity,
      label: "Users who fired CTA clicks",
    },
    audience_hot: {
      count: hotCount,
      lastActivity: lastHot._max.createdAt?.toISOString() ?? null,
      label: "Signed-in users with CTA click and no booking_completed in window",
    },
  };
}
