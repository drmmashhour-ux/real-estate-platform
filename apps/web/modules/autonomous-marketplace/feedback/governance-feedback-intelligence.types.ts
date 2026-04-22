/**
 * Advisory clustering & drift signals over governance feedback rows — no policy mutation.
 */

import type { GovernanceOutcomeLabel } from "./governance-feedback.types";

export type GovernanceIntelligenceSeverity = "INFO" | "WARNING" | "CRITICAL";

export type GovernanceIntelligenceCluster = {
  id: string;
  severity: GovernanceIntelligenceSeverity;
  title: string;
  /** Human-readable slice, e.g. action + region */
  dimension: string;
  labelFocus: GovernanceOutcomeLabel;
  caseCount: number;
  leakedRevenueSum: number;
  rationale: string;
};

export type GovernanceIntelligenceDriftAlert = {
  id: string;
  severity: "WARNING" | "CRITICAL";
  metric: string;
  baselineRate: number;
  recentRate: number;
  delta: number;
  baselineSampleSize: number;
  recentSampleSize: number;
  rationale: string;
};

export type GovernanceIntelligenceAnalysis = {
  clusters: GovernanceIntelligenceCluster[];
  driftAlerts: GovernanceIntelligenceDriftAlert[];
};
