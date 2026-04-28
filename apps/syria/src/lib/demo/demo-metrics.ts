/**
 * Purely simulated investor-style KPIs — no DB, APIs, or production analytics.
 */

export type DemoMetrics = {
  revenue: string;
  growth: string;
  bookings: number;
  conversionRate: string;
  fraudPrevented: number;
  activeUsers: number;
};

const BASE: DemoMetrics = {
  revenue: "$1.2M ARR",
  growth: "+18% MoM",
  bookings: 1240,
  conversionRate: "4.8%",
  fraudPrevented: 37,
  activeUsers: 8421,
};

/** Snapshot matching the investor demo baseline copy. */
export function getDemoMetrics(): DemoMetrics {
  return { ...BASE };
}

/**
 * Slightly drift numbers upward over time for a “live dashboard” feel (deterministic from tick).
 */
export function getDemoMetricsAtTick(tick: number): DemoMetrics {
  if (tick <= 0) return getDemoMetrics();
  const n = Math.floor(tick);

  const revenue = n >= 25 ? "$1.21M ARR" : BASE.revenue;
  const growthPct = 18 + Math.min(4, Math.floor(n / 18));

  return {
    revenue,
    growth: `+${growthPct}% MoM`,
    bookings: BASE.bookings + n * 2 + (n % 9),
    conversionRate: `${(4.8 + (n % 12) * 0.06).toFixed(1)}%`,
    fraudPrevented: BASE.fraudPrevented + Math.floor(n / 3),
    activeUsers: BASE.activeUsers + n * 14 + (n % 17),
  };
}
