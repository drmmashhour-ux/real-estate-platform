export type InsightCategory =
  | "growth"
  | "execution"
  | "compliance"
  | "finance"
  | "broker_productivity"
  | "listing_performance"
  | "negotiation_velocity"
  | "closing_delays"
  | "pipeline_quality"
  | "marketing_output";

export type ImpactLevel = "low" | "medium" | "high";
export type UrgencyLevel = "low" | "medium" | "high";

export type InsightEvidence = {
  /** Reference into internal metrics path or id */
  ref: string;
  /** Observed value when applicable */
  value?: string | number | null;
  /** Whether this row is factual measurement vs labeled inference */
  nature: "fact" | "inference" | "estimate";
};

export type CompanyInsight = {
  insightType: string;
  title: string;
  summary: string;
  impactLevel: ImpactLevel;
  urgency: UrgencyLevel;
  evidence: InsightEvidence[];
  /** 0–1 — lower when comparing windows with small samples */
  confidence: number;
  category: InsightCategory;
  suggestedActions: { label: string; nature: "recommendation" | "fact_check" }[];
};
