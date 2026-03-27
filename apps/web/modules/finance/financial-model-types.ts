/**
 * Operational financial model types — not GAAP statements.
 */

export type RevenueSourceKey = "buyer" | "seller" | "bnhub" | "broker" | "rent" | "other";

export type FinancialPeriod = {
  start: Date;
  end: Date;
  label: string;
};

export type MonthlyBucket = { monthKey: string; label: string; cents: number };

export type RevenueBySource = {
  source: RevenueSourceKey;
  label: string;
  totalCents: number;
  monthly: MonthlyBucket[];
};

export type UserStats = {
  buyers: number;
  sellers: number;
  hosts: number;
  brokers: number;
  totalUsers: number;
};

export type CostBreakdown = {
  hostingCents: number;
  aiApiCents: number;
  marketingCents: number;
  teamCents: number;
  legalOpsCents: number;
  totalCents: number;
};

export type ProfitResult = {
  revenueCents: number;
  costCents: number;
  netProfitCents: number;
  marginPct: number | null;
};

export type FinancialModelPayload = {
  period: FinancialPeriod;
  userStats: UserStats;
  revenueBySource: RevenueBySource[];
  totalRevenueCents: number;
  bookingVolume: { count: number; grossCents: number };
  /** True when DB had no meaningful revenue — UI used illustrative demo figures */
  demoMode: boolean;
  monthlyRevenueTotal: MonthlyBucket[];
  /** Sum of platform revenue events (realized) in period */
  platformRevenueEventsCents: number;
};
