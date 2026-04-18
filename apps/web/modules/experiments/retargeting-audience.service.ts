import { prisma } from "@/lib/db";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

export type RetargetingSnapshot = {
  range: { start: string; end: string };
  segments: {
    id: string;
    label: string;
    count: number;
    trackingNote: string;
  }[];
};

/**
 * Audience sizes derived from existing `traffic_events` + user flags (no PII export here).
 */
export async function getRetargetingSnapshot(days = 30): Promise<RetargetingSnapshot> {
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -Math.max(1, Math.min(90, days)));

  const [lpViews, bookingStarted, bookingDone, retargetUsers] = await Promise.all([
    prisma.trafficEvent.count({
      where: {
        eventType: "page_view",
        path: { contains: "/lp/" },
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.trafficEvent.count({
      where: {
        eventType: "booking_started",
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.trafficEvent.count({
      where: {
        eventType: "booking_completed",
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.user.count({ where: { isRetargetCandidate: true } }),
  ]);

  const bookingDropoff = Math.max(0, bookingStarted - bookingDone);

  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    segments: [
      {
        id: "lp_engagement",
        label: "LP visits (traffic_events page_view /lp/)",
        count: lpViews,
        trackingNote: "Retarget in Ads using URL contains /lp/ or list uploads from CRM exports.",
      },
      {
        id: "booking_abandon",
        label: "Booking started − completed (proxy funnel leak)",
        count: bookingDropoff,
        trackingNote: "Align with booking_started / booking_completed in dashboard; nudge via email/push.",
      },
      {
        id: "user_retarget_flag",
        label: "Users flagged isRetargetCandidate",
        count: retargetUsers,
        trackingNote: "Set by product flows (e.g. evaluate funnel); sync to Ads customer lists with consent.",
      },
    ],
  };
}
