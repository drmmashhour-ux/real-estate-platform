import { prisma } from "@/lib/db";
import { resolveKpiDateRange } from "../broker-kpis/broker-kpi-aggregation.service";
import type { CompanyMetricsWindow, CompanyTimeseriesMetricId, CompanyTimeseriesPayload } from "./company-metrics.types";
import { companyMetricsDisclaimer } from "./company-metrics-explainer";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import {
  commissionCaseWhereForExecutiveScope,
  dealWhereForExecutiveScope,
  fsboListingWhereForExecutiveScope,
  leadWhereForExecutiveScope,
} from "./company-metrics-scope";

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

export async function getCompanyMetricsTimeseries(
  scope: ExecutiveScope,
  metric: CompanyTimeseriesMetricId,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<CompanyTimeseriesPayload> {
  const { start, end } = resolveKpiDateRange(window, custom);
  const days = eachDay(start, end);
  const dealBase = dealWhereForExecutiveScope(scope);
  const leadBase = leadWhereForExecutiveScope(scope);
  const fsboBase = fsboListingWhereForExecutiveScope(scope);
  const points: { date: string; value: number }[] = [];

  for (const { dayStart, dayEnd, key } of days) {
    let value = 0;
    switch (metric) {
      case "closed_deals":
        value = await prisma.deal.count({
          where: {
            ...dealBase,
            status: "closed",
            updatedAt: { gte: dayStart, lte: dayEnd },
          },
        });
        break;
      case "new_leads":
        value = await prisma.lead.count({
          where: { ...leadBase, createdAt: { gte: dayStart, lte: dayEnd } },
        });
        break;
      case "active_listings":
        value = await prisma.fsboListing.count({
          where: {
            ...fsboBase,
            status: "ACTIVE",
            moderationStatus: "APPROVED",
            archivedAt: null,
            updatedAt: { lte: dayEnd },
            createdAt: { lte: dayEnd },
          },
        });
        break;
      case "commission_cents": {
        const rows = await prisma.brokerageCommissionCase.findMany({
          where: {
            ...commissionCaseWhereForExecutiveScope(scope),
            updatedAt: { gte: dayStart, lte: dayEnd },
            status: { in: ["approved", "invoiced", "payout_ready", "paid"] },
          },
          select: { grossCommissionCents: true },
        });
        value = rows.reduce((a, r) => a + r.grossCommissionCents, 0);
        break;
      }
      case "compliance_cases":
        value = await prisma.complianceCase.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            deal: { is: dealBase },
          },
        });
        break;
      default:
        value = 0;
    }
    points.push({ date: key, value });
  }

  return {
    metric,
    window,
    points,
    disclaimer: companyMetricsDisclaimer(),
  };
}
