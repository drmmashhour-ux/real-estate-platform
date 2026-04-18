import { prisma } from "@/lib/db";
import type { BrokerKpiTimeseriesPayload, KpiWindow, TimeseriesMetricId } from "./broker-kpis.types";
import { brokerKpiDisclaimer } from "./broker-kpi-explainer";
import { resolveKpiDateRange } from "./broker-kpi-aggregation.service";

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

export async function getBrokerKpiTimeseries(
  brokerId: string,
  metric: TimeseriesMetricId,
  window: KpiWindow,
  custom?: { from: string; to: string },
): Promise<BrokerKpiTimeseriesPayload> {
  const { start, end } = resolveKpiDateRange(window, custom);
  const days = eachDay(start, end);
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
      case "closed_deals":
        value = await prisma.deal.count({
          where: {
            brokerId,
            status: "closed",
            updatedAt: { gte: dayStart, lte: dayEnd },
          },
        });
        break;
      case "active_deals":
        value = await prisma.deal.count({
          where: {
            brokerId,
            status: { notIn: ["closed", "cancelled"] },
            updatedAt: { lte: dayEnd },
            createdAt: { lte: dayEnd },
          },
        });
        break;
      case "counter_offers": {
        const dealIds = (
          await prisma.deal.findMany({
            where: { brokerId },
            select: { id: true },
          })
        ).map((d) => d.id);
        if (dealIds.length > 0) {
          value = await prisma.negotiationProposal.count({
            where: {
              proposalType: "counter_offer",
              createdAt: { gte: dayStart, lte: dayEnd },
              round: { thread: { dealId: { in: dealIds } } },
            },
          });
        }
        break;
      }
      case "open_requests": {
        const dealIds = (
          await prisma.deal.findMany({
            where: { brokerId },
            select: { id: true },
          })
        ).map((d) => d.id);
        if (dealIds.length > 0) {
          value = await prisma.dealRequest.count({
            where: {
              dealId: { in: dealIds },
              createdAt: { gte: dayStart, lte: dayEnd },
              status: { notIn: ["FULFILLED", "CANCELLED"] },
            },
          });
        }
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
    disclaimer: brokerKpiDisclaimer(),
  };
}
