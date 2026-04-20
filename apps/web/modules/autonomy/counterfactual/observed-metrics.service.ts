import { getListingRevenueMetrics, getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { CounterfactualObservedMetrics } from "./counterfactual.types";

export async function loadObservedCounterfactualMetrics(
  scopeType: string,
  scopeId: string
): Promise<CounterfactualObservedMetrics> {
  if (scopeType === "portfolio") {
    const summary = await getRevenueDashboardSummary(scopeId);
    const p = summary.portfolio;

    return {
      revenue: Number(p.grossRevenue || 0),
      occupancy: Number(p.occupancyRate || 0),
      bookings: Number(p.bookingCount || 0),
      adr: Number(p.adr || 0),
      revpar: Number(p.revpar || 0),
    };
  }

  if (scopeType === "listing") {
    const today = startOfUtcDay(new Date());
    const start = addUtcDays(today, -29);
    const live = await getListingRevenueMetrics(scopeId, { start, end: today });
    if (!live) {
      return {
        revenue: 0,
        occupancy: 0,
        bookings: 0,
        adr: 0,
        revpar: 0,
      };
    }

    return {
      revenue: Number(live.grossRevenue || 0),
      occupancy: Number(live.occupancyRate || 0),
      bookings: Number(live.bookingCount || 0),
      adr: Number(live.adr || 0),
      revpar: Number(live.revpar || 0),
    };
  }

  return {
    revenue: 0,
    occupancy: 0,
    bookings: 0,
    adr: 0,
    revpar: 0,
  };
}
