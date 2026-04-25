/**
 * Coarse, explainable portfolio context — not personal inferences; stable bucket keys.
 */
export type PriceBand = "p_lt300k" | "p_300_600" | "p_600_1m" | "p_1_2m" | "p_gt2m" | "unknown";
export type PropertyTypeCoarse = "residential" | "rental" | "commercial" | "land" | "mortgage" | "unknown";
export type ClientTypeCoarse = "buyer" | "seller" | "investor" | "mortgage" | "other" | "unknown";
export type FinancingBand = "strong" | "medium" | "weak" | "unknown";
export type UrgencyCoarse = "low" | "med" | "high" | "unknown";

export type LeadPortfolioSlice = {
  id: string;
  location?: string | null;
  purchaseRegion?: string | null;
  /** From purchaseRegion / form */
  priceHintCents?: number | null;
  leadType?: string | null;
  leadSource?: string | null;
  /** mortgage_inquiry or tags */
  financingLabel?: string | null;
  urgencyLabel?: string | null;
  workspaceId?: string | null;
  introducedByBrokerId?: string | null;
  estimatedValue?: number | null;
  dealValue?: number | null;
  engagementScore?: number | null;
  propertyType?: string | null;
  /** Raw mortgage form JSON when present; only presence used for bucketing, not PII. */
  mortgageInquiry?: unknown;
};

export type DealPortfolioSlice = {
  id: string;
  priceCents: number;
  crmStage?: string | null;
  status: string;
  /** buyer/seller from context */
  propertyRegion?: string | null;
  lastUpdatedAt: Date;
  leadId?: string | null;
  workspaceId?: string | null;
  brokerId?: string | null;
  /** optional probability 0-1 from CRM / AI */
  closeProbHint?: number | null;
  silenceGapDays?: number | null;
};

export type LoadRebalanceAction = "shift_leads" | "reduce_new_assignments" | "escalate_support" | "none";

export type LoadRebalanceSuggestion = {
  targetBrokerId: string;
  action: LoadRebalanceAction;
  rationale: string;
};

export type DealPriorityResult = {
  priorityScore: number;
  urgencyLevel: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  rationale: string[];
};

export type LeadRoutingResult = {
  recommendedBrokerId: string | null;
  alternatives: string[];
  rationale: string[];
  contextBucket: string;
  scores?: { brokerId: string; score: number; factors: string[] }[];
};

export type SegmentInsight = {
  segmentKey: string;
  totalDeals: number;
  winRate: number | null;
  avgClosingTime: number | null;
  wins: number;
  losses: number;
};

export type BrokerLoadEntry = {
  brokerId: string;
  activeDeals: number;
  activeLeads: number;
  avgResponseTime: number | null;
  workloadScore: number;
};
