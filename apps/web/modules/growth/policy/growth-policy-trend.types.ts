/**
 * Policy trend summaries — derived from stored daily snapshots + reviews; advisory only.
 */

import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";

export type PolicyTrendDirection = "improving" | "worsening" | "stable" | "insufficient_data";

export type PolicyTrendMagnitude = "low" | "medium" | "high";

export type PolicyTrendConfidence = "low" | "medium" | "high";

export type PolicyTrendPoint = {
  date: string;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  recurringCount: number;
  resolvedCount: number;
  /** True when at least one policy evaluation was recorded for this UTC day. */
  hasData: boolean;
};

export type PolicyDomainTrend = {
  domain: GrowthPolicyDomain;
  trend: PolicyTrendDirection;
  changeMagnitude: PolicyTrendMagnitude;
  currentCount: number;
  previousCount: number;
  explanation: string;
};

export type PolicyTrendSummary = {
  windowDays: number;
  overallTrend: PolicyTrendDirection;
  severityTrend: PolicyTrendDirection;
  recurrenceTrend: PolicyTrendDirection;
  domainTrends: PolicyDomainTrend[];
  highlights: string[];
  warnings: string[];
  confidence: PolicyTrendConfidence;
  generatedAt: string;
  /** Raw series for optional charts / QA; same length as window. */
  series: PolicyTrendPoint[];
};
