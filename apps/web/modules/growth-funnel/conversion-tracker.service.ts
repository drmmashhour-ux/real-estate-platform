/**
 * Reads real `launch_events` / `growth_funnel_events` — no synthetic funnel fills.
 */

import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

const PREFIX = "growth:";

export async function countLaunchGrowthEventsSince(
  eventSuffix: string,
  since: Date
): Promise<number> {
  return prisma.launchEvent.count({
    where: {
      event: `${PREFIX}${eventSuffix}`,
      timestamp: { gte: since },
    },
  });
}

export async function countGrowthFunnelSince(eventName: string, since: Date): Promise<number> {
  return prisma.growthFunnelEvent.count({
    where: {
      eventName: eventName.startsWith(PREFIX) ? eventName : `${PREFIX}${eventName}`,
      createdAt: { gte: since },
    },
  });
}

export async function getGrowthEventWindowCounts(windowDays: number): Promise<Record<string, number>> {
  const since = subDays(new Date(), windowDays);
  const keys = ["signup", "create_listing", "view_listing", "booking_start", "booking_complete", "referral_signup"] as const;
  const out: Record<string, number> = {};
  await Promise.all(
    keys.map(async (k) => {
      out[k] = await countLaunchGrowthEventsSince(k, since);
    })
  );
  return out;
}
