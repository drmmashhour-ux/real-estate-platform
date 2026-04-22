/** BNHub listing/portfolio metric shapes — thin re-export (implementation in `modules/bnhub-revenue/`). */
export type {
  BnhubRevenueDashboardShell,
  ListingRevenueMetrics,
  PortfolioRevenueMetrics,
} from "../bnhub-revenue/bnhub-revenue.types";

/** Cross-hub monetization engine (LECIPM). */
export type LecipmHubRevenueKey =
  | "bnhub"
  | "broker"
  | "seller"
  | "buyer"
  | "investor"
  | "residence"
  | "platform";

export type LecipmRevenueByHubRow = {
  hubKey: string;
  hubLabel: string;
  platformCents: number;
  transactionCount: number;
};

export type LecipmMonetizationMetricsVm = {
  periodDays: number;
  periodStart: string;
  periodEnd: string;
  totalPlatformCents: number;
  dailyAverageCents: number;
  transactionCount: number;
  mrrCentsApprox: number;
  /** Active paying workspace subscriptions (Stripe mirror). */
  activeWorkspaceSubscriptions: number;
  activeBrokerSaaSSubscriptions: number;
  brokerLeadRevenueCents: number;
  revenueByHub: LecipmRevenueByHubRow[];
  /** Approximate ARPU — platform share / active paying users (Stripe subs + broker SaaS). */
  averageRevenuePerPayingUserCents: number | null;
  payingUsersApprox: number;
};
