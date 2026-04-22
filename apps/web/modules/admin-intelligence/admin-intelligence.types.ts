/** Typed view-models for LECIPM Admin Super Dashboard + mobile APIs */

export type HubPerformanceRow = {
  hubKey: string;
  hubLabel: string;
  revenueCents: number;
  transactionCount: number;
  deltaPctVsPriorDay: number | null;
};

export type AdminGlobalStatsVm = {
  totalRevenue30dCents: number;
  transactions30d: number;
  activeUsersApprox: number;
  /** New users in last 30d vs prior 30d window. */
  userGrowthPct: number | null;
  bookingsToday: number;
  leadsToday: number;
  listingsTotalApprox: number;
  /** Care events / Soins signals in window */
  residenceActivityCount: number;
};

export type AdminRecentActivityItem = {
  id: string;
  kind: "booking" | "lead" | "payment" | "listing";
  label: string;
  detail: string;
  occurredAt: string;
  amountCents?: number | null;
};

export type AiInsightVm = {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
  priority: number;
};

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH";

export type AdminAnomalyVm = {
  id: string;
  severity: AnomalySeverity;
  title: string;
  explanation: string;
  recommendedAction: string;
};

export type AdminSuperDashboardPayload = {
  generatedAt: string;
  global: AdminGlobalStatsVm;
  revenueTodayCents: number;
  revenueSevenDayAvgCents: number;
  revenueGrowthPctVsPriorDay: number | null;
  hubPerformance: HubPerformanceRow[];
  revenueSeries14d: Array<{ date: string; revenueCents: number }>;
  insights: AiInsightVm[];
  anomalies: AdminAnomalyVm[];
  recentActivity: AdminRecentActivityItem[];
};
