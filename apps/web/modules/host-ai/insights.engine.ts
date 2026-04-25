import {
  getHostDashboardStats,
  getHostListingPerformanceTop,
  type HostListingPerformanceRow,
} from "@/lib/host/dashboard-data";

export type HostInsightBullet = { title: string; detail: string };

export type HostInsightsResult = {
  occupancyTrends: HostInsightBullet[];
  revenueOpportunities: HostInsightBullet[];
  weakPoints: HostInsightBullet[];
  reasoning: string[];
};

function weakFromPerformance(rows: HostListingPerformanceRow[]): HostInsightBullet[] {
  const out: HostInsightBullet[] = [];
  for (const r of rows) {
    const rate = r.views > 0 ? r.bookings / r.views : 0;
    if (r.views >= 40 && r.bookings <= 1 && rate < 0.03) {
      out.push({
        title: `Conversion gap: ${r.title.slice(0, 36)}`,
        detail:
          "Strong views but few bookings — revisit cover photo, headline, and price vs peers; see listing optimizer suggestions.",
      });
    }
    if (r.views < 15 && r.bookings === 0) {
      out.push({
        title: `Visibility: ${r.title.slice(0, 36)}`,
        detail: "Low recent views — check listing is published, pricing is in a normal band, and photos meet quality bar.",
      });
    }
  }
  return out.slice(0, 4);
}

function revenueFromPerformance(rows: HostListingPerformanceRow[], avgNightlyCents: number): HostInsightBullet[] {
  const out: HostInsightBullet[] = [];
  const top = rows[0];
  if (top && top.bookings >= 3 && top.nightPriceCents > 0) {
    out.push({
      title: "Double down on the leader",
      detail: `"${top.title.slice(0, 40)}" is converting — consider modest seasonal premiums when demand is strong (within your safety band).`,
    });
  }
  const underpriced = rows.find((r) => r.nightPriceCents > 0 && avgNightlyCents > 0 && r.nightPriceCents < avgNightlyCents * 0.82);
  if (underpriced) {
    out.push({
      title: "Possible rate headroom",
      detail: `"${underpriced.title.slice(0, 36)}" is priced below your portfolio average — validate comps before raising.`,
    });
  }
  return out.slice(0, 4);
}

/**
 * Read-only portfolio readout for the host dashboard.
 */
export async function buildHostInsights(hostId: string): Promise<HostInsightsResult> {
  const reasoning: string[] = [
    "Insights use your dashboard stats and recent listing analytics — not a guarantee of future performance.",
  ];

  const [stats, perf] = await Promise.all([
    getHostDashboardStats(hostId),
    getHostListingPerformanceTop(hostId, 8),
  ]);

  const occupancyTrends: HostInsightBullet[] = [
    {
      title: "30-day occupancy snapshot",
      detail: `Estimated occupancy across published listings is about ${stats.occupancyRatePercent}%. ${
        stats.earningsTrend === "up"
          ? "Revenue this month is trending up vs last month — good moment to protect margin on peak nights."
          : stats.earningsTrend === "down"
            ? "Revenue is softer than last month — test targeted discounts or listing improvements before deep cuts."
            : "Revenue is roughly flat — small listing tweaks or calendar hygiene can unlock the next step."
      }`,
    },
  ];

  const revenueOpportunities = revenueFromPerformance(perf, stats.averageNightlyRateCents);
  if (stats.upcomingBookings === 0 && stats.publishedListings > 0) {
    revenueOpportunities.push({
      title: "Fill the near-term calendar",
      detail: "No upcoming stays showing — refresh photos, adjust minimum nights, or run a short promotional window.",
    });
  }

  const weakPoints = weakFromPerformance(perf);

  return {
    occupancyTrends,
    revenueOpportunities,
    weakPoints,
    reasoning,
  };
}
