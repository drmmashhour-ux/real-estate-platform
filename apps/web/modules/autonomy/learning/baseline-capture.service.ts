import { getListingRevenueMetrics, getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { BaselineMetrics } from "./learning.types";

const ZERO: BaselineMetrics = {
  grossRevenue: 0,
  occupancyRate: 0,
  bookingCount: 0,
  adr: 0,
  revpar: 0,
};

export async function captureBaselineMetrics(scopeType: string, scopeId: string): Promise<BaselineMetrics> {
  if (scopeType === "portfolio") {
    const summary = await getRevenueDashboardSummary(scopeId);
    const p = summary.portfolio;

    return {
      grossRevenue: Number(p.grossRevenue || 0),
      occupancyRate: Number(p.occupancyRate || 0),
      bookingCount: Number(p.bookingCount || 0),
      adr: Number(p.adr || 0),
      revpar: Number(p.revpar || 0),
    };
  }

  if (scopeType === "listing") {
    const today = startOfUtcDay(new Date());
    const start = addUtcDays(today, -29);
    const live = await getListingRevenueMetrics(scopeId, { start, end: today });
    if (!live) return { ...ZERO };

    return {
      grossRevenue: Number(live.grossRevenue || 0),
      occupancyRate: Number(live.occupancyRate || 0),
      bookingCount: Number(live.bookingCount || 0),
      adr: Number(live.adr || 0),
      revpar: Number(live.revpar || 0),
    };
  }

  return { ...ZERO };
}
