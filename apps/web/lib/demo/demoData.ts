export const investorDemoMetrics = {
  users: 12840,
  listings: 3420,
  bookings: 876,
  users7d: 420,
  users30d: 1180,
  revenue: 184500,
  conversionRate: 0.087,
  complianceScore: 94,
} as const;

/**
 * `GET /api/investor/platform-dashboard` and `/dashboard/investor/platform` (demo / pitch).
 * Shape matches live {@link getInvestorDashboard} output.
 */
export const investorPlatformDemoMetrics = {
  users: 12840,
  listings: 3420,
  bookings: 876,
  users7d: 420,
  users30d: 1180,
  revenue: 184_500.25,
  growth: {
    message: "Growth engine disabled in demo mode",
    _demo: true as const,
  },
  /** Rows in `ListingOptimization` (listing-level AI optimization snapshots). */
  aiImpact: 2100,
  /** Rows in `ai_execution_logs` (autonomous `executeActions` audit trail). */
  aiRevenueLift: 18_500,
} as const;
