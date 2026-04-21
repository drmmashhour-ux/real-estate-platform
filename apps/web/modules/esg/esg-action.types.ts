/** Action Center generation / snapshot semver */
export const ESG_ACTION_CENTER_VERSION = "v1.0.0";

export type EsgActionCategory =
  | "DATA"
  | "DISCLOSURE"
  | "ENERGY"
  | "CARBON"
  | "HEALTH"
  | "RESILIENCE"
  | "CERTIFICATION"
  | "FINANCE";

export type EsgActionType =
  | "QUICK_WIN"
  | "OPERATIONAL"
  | "CAPEX"
  | "STRATEGIC"
  | "DOCUMENTATION";

export type EsgActionPriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type EsgActionStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "DISMISSED";

export type CostBand = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type EffortBand = "LOW" | "MEDIUM" | "HIGH";
/** Stored as VarChar — values like `<30D`, `1-3M`, … */
export type TimelineBand = string;
export type PaybackBand = "<3Y" | "3-7Y" | "7Y+" | "UNKNOWN";

export type OwnerType = "BROKER" | "INVESTOR" | "ADMIN" | "SHARED";

/** Draft before persistence / prioritization */
export type EsgActionDraft = {
  reasonCode: string;
  title: string;
  description: string;
  category: EsgActionCategory;
  actionType: EsgActionType;
  reasonText: string;
  ownerType: OwnerType;
  blockersJson?: unknown;
  dependenciesJson?: unknown;
  evidenceNeededJson?: unknown;
};

export type SerializedEsgAction = {
  id: string;
  listingId: string;
  title: string;
  description: string;
  category: string;
  actionType: string;
  priority: string;
  status: string;
  reasonCode: string;
  reasonText: string | null;
  estimatedScoreImpact: number | null;
  estimatedCarbonImpact: number | null;
  estimatedConfidenceImpact: number | null;
  estimatedCostBand: string | null;
  estimatedEffortBand: string | null;
  estimatedTimelineBand: string | null;
  paybackBand: string | null;
  ownerType: string | null;
  assigneeUserId: string | null;
  implementationNotes: string | null;
  generatedFromVersion: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type PotentialUpliftSummary = {
  narrative: string;
  scoreBandHint: string;
  confidenceBandHint: string;
  disclaimer: string;
};

export type InvestorActionCenterAppendix = {
  topActions: Array<{ title: string; priority: string; timeline: string | null; why: string }>;
  quickWins: Array<{ title: string; timeline: string | null }>;
  majorBlockers: Array<{ title: string; priority: string }>;
  strategicCapex: Array<{ title: string; costBand: string | null }>;
  estimatedReadinessImprovement: string;
};
