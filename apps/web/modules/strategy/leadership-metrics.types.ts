/**
 * Leadership KPIs — all customer-facing use must be tied to these measured inputs
 * (no unqualified “#1” or market-share claims).
 */

export type LeadershipMetrics = {
  /** Brokers with account active in scope */
  activeBrokers: number;
  /** Deals in selected pipeline states (see data layer) in period */
  dealsProcessed: number;
  /** 0–1 ratio: engagement intensity vs. internal target, not a third-party benchmark */
  engagementRate: number;
  /** Platform-attributed revenue in scope, minor units (e.g. cents) */
  revenueCents: number;
  /** When metrics were collected */
  asOfIso: string;
  /** e.g. montreal / quebec / global */
  scope: string;
};
