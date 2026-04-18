import { prisma } from "@/lib/db";

/** Funnel steps using `EventLog` event names — additive; safe when table sparse. */
export async function listFunnelStepCounts(since: Date, funnel: "listing" | "bnhub" | "host") {
  const map: Record<string, string[]> = {
    listing: ["listing_impression", "listing_click", "listing_save", "inquiry_submit"],
    bnhub: ["search_performed", "listing_click", "booking_start", "booking_complete"],
    host: ["roi_calculator_started", "roi_calculator_completed", "onboarding_started", "onboarding_completed"],
  };
  const types = map[funnel];
  const rows = await prisma.eventLog.groupBy({
    by: ["eventType"],
    where: { eventType: { in: types }, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.eventType, r._count._all]));
}
