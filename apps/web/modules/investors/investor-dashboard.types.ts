/**
 * Auto-generated investor view — uses real platform signals only; no guarantees.
 */

export type MetricConfidence = "low" | "medium" | "high";

export type InvestorMetric = {
  label: string;
  /** Display string — numeric formatting only; never inferred dollars without CRM backing. */
  value: string;
  /** Human-readable delta vs prior window when computed from stored counts. */
  change?: string;
  /** Period label, e.g. "last 14d". */
  period: string;
  confidence: MetricConfidence;
};

export type InvestorSectionType = "metrics" | "narrative" | "insights" | "risks";

export type InvestorSection = {
  title: string;
  content: string;
  type: InvestorSectionType;
};

export type InvestorNarrative = {
  headline: string;
  summary: string;
  growthStory: string[];
  executionProof: string[];
  expansionStory: string[];
  risks: string[];
  /** Forward-looking framing — advisory, not a forecast guarantee. */
  outlook: string[];
};

export type InvestorDashboard = {
  metrics: InvestorMetric[];
  sections: InvestorSection[];
  narrative: InvestorNarrative;
  generatedAt: string;
  meta: {
    warnings: string[];
    missingDataAreas: string[];
    /** True when majority of headline metrics are low-confidence. */
    sparseBundle: boolean;
  };
};
