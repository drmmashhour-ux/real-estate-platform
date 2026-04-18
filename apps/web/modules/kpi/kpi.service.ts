import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCoreMetricsBundle, rangeFromDays, type MetricsRequest } from "@/modules/metrics/metrics.service";
import { previousPeriod } from "@/modules/metrics/timeseries.service";
import { KPI_DEFINITIONS, type KpiKey } from "./kpi.definitions";

export type KpiValue = {
  key: KpiKey;
  value: number | string | null;
  formatted: string;
  isEstimate: boolean;
  explanation: string;
};

export async function computeKpiSnapshot(req: MetricsRequest): Promise<{
  kpis: KpiValue[];
  priorRange: { from: string; toExclusive: string };
}> {
  const current = await getCoreMetricsBundle(req);
  const prev = previousPeriod(req.from, req.toExclusive);
  const priorReq: MetricsRequest = { ...req, from: prev.from, toExclusive: prev.toExclusive };
  const prior = await getCoreMetricsBundle(priorReq);

  const newNow = current.traffic.newUsersInRange;
  const newPrev = prior.traffic.newUsersInRange;
  const userGrowthRate = (newNow - newPrev) / Math.max(1, newPrev);

  const { _sum } = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.COMPLETED,
      createdAt: { gte: req.from, lt: req.toExclusive },
    },
    _sum: { amountCents: true },
  });
  const gmvProxy = _sum.amountCents ?? 0;

  const priorRev = prior.revenue.totalRevenueCents;
  const revGrowth = (current.revenue.totalRevenueCents - priorRev) / Math.max(1, priorRev);

  const rollup = await import("@/src/modules/conversion/conversion-metrics.service").then((m) =>
    m.getEventLogConversionRollup(req.from)
  );
  const bst = rollup.counts.booking_start ?? 0;
  const bcmp = rollup.counts.booking_complete ?? 0;
  const funnelHealth = bst > 0 ? bcmp / bst : null;

  const topLiq = current.supplyDemand.topAreas[0];
  const liquidityHeadline = topLiq
    ? `${topLiq.city} · liquidity ${topLiq.ratio.toFixed(0)}`
    : "n/a";

  const activeUserProxy = (current.traffic.returningUsersEstimate ?? 0) + newNow;
  const arpuEstimate =
    activeUserProxy > 0 ? Math.round(current.revenue.totalRevenueCents / activeUserProxy) : null;

  const kpis: KpiValue[] = [
    {
      key: "user_growth_rate",
      value: userGrowthRate,
      formatted: `${(userGrowthRate * 100).toFixed(1)}%`,
      isEstimate: KPI_DEFINITIONS.user_growth_rate.isEstimate,
      explanation: KPI_DEFINITIONS.user_growth_rate.description,
    },
    {
      key: "listing_growth_rate",
      value: current.marketplace.listingGrowthRate,
      formatted:
        current.marketplace.listingGrowthRate != null
          ? `${(current.marketplace.listingGrowthRate * 100).toFixed(1)}%`
          : "n/a",
      isEstimate: KPI_DEFINITIONS.listing_growth_rate.isEstimate,
      explanation: current.marketplace.listingGrowthNote,
    },
    {
      key: "gmv_proxy_cents",
      value: gmvProxy,
      formatted: `$${(gmvProxy / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`,
      isEstimate: KPI_DEFINITIONS.gmv_proxy_cents.isEstimate,
      explanation: "Completed `payments.amount_cents` in range (BNHub/marketplace payments).",
    },
    {
      key: "engagement_ctr",
      value: current.engagement.ctr,
      formatted: `${(current.engagement.ctr * 100).toFixed(2)}%`,
      isEstimate: KPI_DEFINITIONS.engagement_ctr.isEstimate,
      explanation: current.engagement.ctrNote,
    },
    {
      key: "liquidity_headline",
      value: liquidityHeadline,
      formatted: liquidityHeadline,
      isEstimate: KPI_DEFINITIONS.liquidity_headline.isEstimate,
      explanation: "Top city by liquidity table in current metrics bundle.",
    },
    {
      key: "conversion_funnel_health",
      value: funnelHealth,
      formatted: funnelHealth != null ? `${(funnelHealth * 100).toFixed(1)}%` : "n/a",
      isEstimate: KPI_DEFINITIONS.conversion_funnel_health.isEstimate,
      explanation: KPI_DEFINITIONS.conversion_funnel_health.description,
    },
    {
      key: "arpu_cents_estimate",
      value: arpuEstimate,
      formatted: arpuEstimate != null ? `$${(arpuEstimate / 100).toFixed(2)}` : "n/a",
      isEstimate: true,
      explanation:
        "Revenue / (returning proxy + new users in range). Rough proxy — not audited ARPU.",
    },
    {
      key: "revenue_growth_rate",
      value: revGrowth,
      formatted: `${(revGrowth * 100).toFixed(1)}%`,
      isEstimate: KPI_DEFINITIONS.revenue_growth_rate.isEstimate,
      explanation: KPI_DEFINITIONS.revenue_growth_rate.description,
    },
  ];

  return {
    kpis,
    priorRange: { from: prev.from.toISOString(), toExclusive: prev.toExclusive.toISOString() },
  };
}

export async function computeKpiSnapshotPreset(days: number) {
  const { from, toExclusive } = rangeFromDays(days);
  return computeKpiSnapshot({ from, toExclusive, segment: {} });
}
