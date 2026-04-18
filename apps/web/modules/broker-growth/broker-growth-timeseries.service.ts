import { prisma } from "@/lib/db";
import { resolveKpiDateRange } from "../broker-kpis/broker-kpi-aggregation.service";
import type { KpiWindow } from "../broker-kpis/broker-kpis.types";
import { brokerGrowthDisclaimer } from "./broker-growth-explainer";
import type { GrowthTimeseriesMetricId, GrowthTimeseriesPayload } from "./broker-growth.types";
import { getBrokerResidentialListingIds } from "@/lib/broker/residential-fsbo-scope";

function eachDay(start: Date, end: Date): { dayStart: Date; dayEnd: Date; key: string }[] {
  const out: { dayStart: Date; dayEnd: Date; key: string }[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(23, 59, 59, 999);
  while (cur <= last) {
    const dayStart = new Date(cur);
    const dayEnd = new Date(cur);
    dayEnd.setHours(23, 59, 59, 999);
    out.push({
      dayStart,
      dayEnd,
      key: dayStart.toISOString().slice(0, 10),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getBrokerGrowthTimeseries(
  brokerId: string,
  metric: GrowthTimeseriesMetricId,
  window: KpiWindow,
  custom?: { from: string; to: string },
): Promise<GrowthTimeseriesPayload> {
  const { start, end } = resolveKpiDateRange(window, custom);
  const days = eachDay(start, end);
  const listingIds = await getBrokerResidentialListingIds(brokerId);

  const points: { date: string; value: number }[] = [];

  for (const { dayStart, dayEnd, key } of days) {
    let value = 0;
    switch (metric) {
      case "new_leads":
        value = await prisma.lead.count({
          where: {
            introducedByBrokerId: brokerId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        });
        break;
      case "listing_views":
        if (listingIds.length > 0) {
          value = await prisma.buyerListingView.count({
            where: { fsboListingId: { in: listingIds }, createdAt: { gte: dayStart, lte: dayEnd } },
          });
        }
        break;
      case "listing_inquiries":
        if (listingIds.length > 0) {
          const a = await prisma.fsboLead.count({
            where: { listingId: { in: listingIds }, createdAt: { gte: dayStart, lte: dayEnd } },
          });
          const b = await prisma.lead.count({
            where: {
              fsboListingId: { in: listingIds },
              introducedByBrokerId: brokerId,
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          });
          value = a + b;
        }
        break;
      case "closed_deals":
        value = await prisma.deal.count({
          where: {
            brokerId,
            status: "closed",
            updatedAt: { gte: dayStart, lte: dayEnd },
          },
        });
        break;
      case "broker_revenue_cents": {
        const lines = await prisma.brokerageCommissionSplitLine.findMany({
          where: {
            payeeKind: "broker",
            payeeUserId: brokerId,
            commissionCase: {
              brokerUserId: brokerId,
              status: { in: ["approved", "invoiced", "payout_ready", "paid"] },
              transactionType: "residential_sale",
              updatedAt: { gte: dayStart, lte: dayEnd },
            },
          },
          select: { amountCents: true },
        });
        value = lines.reduce((a, l) => a + l.amountCents, 0);
        break;
      }
      default:
        value = 0;
    }
    points.push({ date: key, value });
  }

  return {
    metric,
    window,
    points,
    disclaimer: brokerGrowthDisclaimer(),
  };
}
