import { prisma } from "@/lib/db";
import {
  getSocialScheduler,
  schedulerPostsPerDayTarget,
  type SchedulerName,
} from "@/lib/bnhub/content-pipeline/env";

export type SchedulerDispatchInput = {
  listingId: string;
  caption: string;
  hashtags: string[];
  videoUrl: string | null;
  /** ISO title for scheduler UI */
  title: string;
};

export type SchedulerDispatchResult = {
  provider: SchedulerName;
  externalId: string | null;
  scheduledFor: Date | null;
  skippedReason?: string;
};

/**
 * Spread posts across the day (2–3 slots) based on env + today's already-scheduled count.
 */
async function pickNextSlotUtc(): Promise<Date> {
  const targetPerDay = schedulerPostsPerDayTarget();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const countToday = await prisma.contentGenerated.count({
    where: {
      scheduledFor: { gte: start, lt: end },
      schedulerExternalId: { not: null },
    },
  });

  const slotIndex = Math.min(countToday, Math.max(0, targetPerDay - 1));
  const hourUtc = 14 + slotIndex * 3; // 14:00, 17:00, 20:00 UTC (example)
  const d = new Date();
  d.setUTCHours(Math.min(hourUtc, 21), 0, 0, 0);
  if (d.getTime() < Date.now()) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

/**
 * Metricool / Later: send post payload when API tokens exist; otherwise no-op with reason.
 */
export async function dispatchToSocialScheduler(input: SchedulerDispatchInput): Promise<SchedulerDispatchResult> {
  const provider = getSocialScheduler();
  if (provider === "none") {
    return {
      provider: "none",
      externalId: null,
      scheduledFor: null,
      skippedReason: "SOCIAL_SCHEDULER=none",
    };
  }

  const token =
    provider === "metricool"
      ? process.env.METRICOOL_API_TOKEN?.trim()
      : process.env.LATER_API_TOKEN?.trim();

  if (!token) {
    const scheduledFor = await pickNextSlotUtc();
    return {
      provider,
      externalId: null,
      scheduledFor,
      skippedReason: `${provider === "metricool" ? "METRICOOL_API_TOKEN" : "LATER_API_TOKEN"} not set — slot reserved locally only`,
    };
  }

  void token;
  void input;
  const scheduledFor = await pickNextSlotUtc();
  return {
    provider,
    externalId: `${provider}_stub_${input.listingId.slice(0, 8)}_${Date.now()}`,
    scheduledFor,
    skippedReason: "Scheduler HTTP not wired — external id is a placeholder",
  };
}
