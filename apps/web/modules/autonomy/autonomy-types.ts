/**
 * LECIPM autonomy loop — domains, payloads, and aggregate inputs for generateDecisions().
 */

export const AUTONOMY_DOMAINS = ["MATCHING", "PRICING", "RANKING", "GROWTH"] as const;
export type AutonomyDomain = (typeof AUTONOMY_DOMAINS)[number];

export const AUTONOMY_DECISION_STATUSES = [
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "AUTO_APPLIED",
  "APPLIED",
  "ROLLED_BACK",
  "INVALID",
] as const;
export type AutonomyDecisionStatus = (typeof AUTONOMY_DECISION_STATUSES)[number];

/** Relative magnitude of change (e.g. 0.03 = 3%). Used for <5% auto-allow guardrail. */
export const SMALL_CHANGE_THRESHOLD = 0.05;

export type BaselineMetrics = {
  seniorConversionRate30d: number;
  avgLeadScore: number | null;
  leadVolume30d: number;
  demandIndex: number;
  matchingEventsTotal: number;
};

export type ResidenceRankingSignal = {
  residenceId: string;
  performanceScore: number;
  views: number;
  conversionRate: number;
};

export type AutonomyDecisionInputs = {
  baseline: BaselineMetrics;
  leadRule: {
    basePrice: number;
    minPrice: number;
    maxPrice: number;
    demandFactor: number;
    qualityFactor: number;
  };
  topByPerformance: ResidenceRankingSignal[];
  lowVisibilityHighConverter: ResidenceRankingSignal[];
  gtmOnboardingEvents30d: number;
};

export type DecisionPayload =
  | {
      kind: "adjust_matching_weights";
      /** Max single-dimension delta as fraction of default (±). */
      deltas: { care: number; budget: number; location: number; service: number };
    }
  | {
      kind: "adjust_lead_scoring_weights";
      deltas: { wEngagement: number; wBudget: number; wCare: number; wIntent: number; wSource: number };
    }
  | {
      kind: "adjust_lead_base_price";
      /** Relative delta to base price, e.g. 0.04 */
      relativeDelta: number;
    }
  | {
      kind: "boost_residence_rank";
      residenceIds: string[];
      /** Additive points per residence, clamped server-side. */
      deltaPoints: number;
    }
  | {
      kind: "gtm_onboarding_emphasis";
      emphasis: "operator_outreach" | "family_nurture" | "listing_quality";
      note: string;
    };

export type GeneratedDecisionDraft = {
  domain: AutonomyDomain;
  action: string;
  rationale: string;
  confidence: number;
  impactEstimate: number | null;
  magnitude: number;
  payload: DecisionPayload;
};
