/**
 * Platform-level aggregates for paid landing funnels (anonymous events + CRM leads).
 * Uses real `MarketingSystemEvent` + `Lead` rows only — no fabricated conversion rates.
 */
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdsLandingMetrics = {
  windowDays: number;
  trafficSourceLabel: string;
  funnelSteps: {
    landing_view: number;
    cta_click: number;
    listing_view: number;
    lead_capture: number;
  };
  leadsFromPublicLanding: number;
  /** lead_capture ÷ landing_view when both &gt; 0 */
  conversionRateViewToLeadPercent: number | null;
  note: string;
};

export async function buildAdsLandingMetrics(windowDays: number): Promise<AdsLandingMetrics> {
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
  const landingView = byKey["landing_view"] ?? 0;
  const leadCapture = byKey["lead_capture"] ?? 0;

  const leadsFromPublicLanding = await prisma.lead.count({
    where: {
      leadSource: "ads_landing_public",
      createdAt: { gte: since },
    },
  });

  return {
    windowDays,
    trafficSourceLabel: "Paid ads → LECIPM landing (tracked)",
    funnelSteps: {
      landing_view: landingView,
      cta_click: byKey["cta_click"] ?? 0,
      listing_view: byKey["listing_view"] ?? 0,
      lead_capture: leadCapture,
    },
    leadsFromPublicLanding,
    conversionRateViewToLeadPercent:
      landingView > 0 ? Math.round((leadCapture / landingView) * 10000) / 100 : null,
    note:
      "Funnel steps are anonymous (userId null). “Best ads” live in Meta/Google; map UTM to these rows for creative review.",
  };
}
