/**
 * End-to-end ads landing funnel metrics (views → lead → booking → revenue proxy).
 * Uses real MarketingSystemEvent rows with `meta.source = ads_landing_beacon` where applicable.
 */
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildAdsLandingMetrics } from "./ads-landing-metrics.service";

export type AdsFunnelMetrics = {
  windowDays: number;
  views: number;
  clicks: number;
  leads: number;
  /** Distinct lead_submit client beacons + server lead_capture (dedup overlap possible). */
  leadSignals: { lead_submit: number; lead_capture: number };
  bookings: number;
  revenueCents: number;
  rates: {
    clickThroughPercent: number | null;
    leadRatePercent: number | null;
    bookingRatePercent: number | null;
  };
  note: string;
};

export async function buildAdsFunnelMetrics(windowDays: number): Promise<AdsFunnelMetrics> {
  const base = await buildAdsLandingMetrics(windowDays);
  const since = new Date(Date.now() - windowDays * 86400000);

  const funnelRows = await prisma.marketingSystemEvent.groupBy({
    by: ["eventKey"],
    where: {
      category: MarketingSystemEventCategory.FUNNEL,
      createdAt: { gte: since },
      meta: { path: ["source"], equals: "ads_landing_beacon" },
    },
    _count: { _all: true },
  });
  const byKey = Object.fromEntries(funnelRows.map((r) => [r.eventKey, r._count._all]));
  const leadSubmit = byKey["lead_submit"] ?? 0;
  const leadCapture = byKey["lead_capture"] ?? 0;
  const leads = Math.max(base.funnelSteps.lead_capture, leadSubmit, leadCapture);

  const bookings = await prisma.marketingSystemEvent.count({
    where: {
      category: MarketingSystemEventCategory.FUNNEL,
      eventKey: "booking_completed",
      createdAt: { gte: since },
      meta: { path: ["source"], equals: "bnhub" },
    },
  });

  const revenueAgg = await prisma.marketingSystemEvent.aggregate({
    where: {
      category: MarketingSystemEventCategory.PERFORMANCE,
      eventKey: "revenue",
      createdAt: { gte: since },
      meta: { path: ["type"], equals: "booking_completed" },
    },
    _sum: { amountCents: true },
  });

  const views = base.funnelSteps.landing_view;
  const clicks = base.funnelSteps.cta_click;

  return {
    windowDays,
    views,
    clicks,
    leads,
    leadSignals: { lead_submit: leadSubmit, lead_capture: leadCapture },
    bookings,
    revenueCents: revenueAgg._sum.amountCents ?? 0,
    rates: {
      clickThroughPercent: views > 0 ? Math.round((clicks / views) * 10000) / 100 : null,
      leadRatePercent: views > 0 ? Math.round((leads / views) * 10000) / 100 : null,
      bookingRatePercent: views > 0 ? Math.round((bookings / views) * 10000) / 100 : null,
    },
    note:
      "Revenue sums PERFORMANCE revenue events tagged booking_completed (BNHub). Map UTM in Ads UI to validate creative-level ROI.",
  };
}
