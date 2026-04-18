/**
 * Growth Policy Enforcement Layer V1 — advisory evaluation results (no runtime blocking).
 */

export type GrowthPolicyDomain =
  | "ads"
  | "cro"
  | "leads"
  | "messaging"
  | "content"
  | "pricing"
  | "broker"
  | "governance";

export type GrowthPolicySeverity = "info" | "warning" | "critical";

export type GrowthPolicyResult = {
  id: string;
  domain: GrowthPolicyDomain;
  severity: GrowthPolicySeverity;
  title: string;
  description: string;
  recommendation: string;
};

/** Canonical input shape — rules only fire when required fields are present (no guessing). */
export type EvaluateGrowthPoliciesContext = {
  autopilotActions?: Array<{
    id?: string;
    title?: string;
    source?: string;
    status?: string;
    executionMode?: string;
  }>;
  governanceDecision?: {
    status?: string;
    topRisks?: Array<{ title?: string; severity?: string }>;
    blockedDomains?: string[];
    frozenDomains?: string[];
    notes?: string[];
  } | null;
  revenueSummary?: {
    revenueToday?: number;
    revenueWeek?: number;
    leadsViewed?: number;
    leadsUnlocked?: number;
    leadUnlockRate?: number;
    bookingStarts?: number;
    bookingCompleted?: number;
  } | null;
  leadMetrics?: {
    viewed?: number;
    unlocked?: number;
    followUpQueue?: number;
    responded?: number;
    closedWon?: number;
    closedLost?: number;
  } | null;
  adsMetrics?: {
    impressions?: number;
    clicks?: number;
    leads?: number;
    conversionRate?: number;
  } | null;
  messagingMetrics?: {
    queued?: number;
    responded?: number;
    responseRate?: number;
  } | null;
  brokerMetrics?: {
    activeBrokers?: number;
    slowResponseBrokerCount?: number;
    lowCloseRateBrokerCount?: number;
    avgCloseRate?: number;
  } | null;
  pricingMetrics?: {
    unstableSignals?: boolean;
    volatilityScore?: number;
  } | null;
  contentMetrics?: {
    generatedCount?: number;
    engagementCount?: number;
  } | null;
  /** Legacy CRO funnel (optional). */
  croMetrics?: {
    visits?: number;
    conversions?: number;
  } | null;
};

/** @deprecated Prefer `EvaluateGrowthPoliciesContext` */
export type GrowthPolicyEvaluationContext = EvaluateGrowthPoliciesContext;
