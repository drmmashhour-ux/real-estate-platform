/**
 * Aggregated, organization-internal stats only. No cross-workspace fields.
 * Used for insight generation and benchmarking (privacy: counts & rates).
 */
export type AggregatedDealStats = {
  workspaceId: string;
  historyRows: number;
  won: number;
  lost: number;
  canceled: number;
  /** Average days from deal createdAt to history createdAt when timeline missing. */
  avgDaysToOutcome: number | null;
  avgPriceCentsWhenWon: number | null;
  /** Share of won deals that had ≥1 document at time of snapshot (approximated via current deal doc count). */
  documentRateWhenWon: number | null;
  bypassFlagRate: number;
  /** Distinct brokers with history in workspace. */
  activeBrokersInHistory: number;
};

export type DealInsights = {
  successPatterns: string[];
  riskFactors: string[];
  optimalStrategies: string[];
  /** Explicit privacy note for UI. */
  dataScope: "workspace_aggregates_only";
};
