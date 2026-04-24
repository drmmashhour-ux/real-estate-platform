/** Supervised AI CEO layer — shared types */

export const CEO_DOMAINS = ["GROWTH", "PRICING", "OUTREACH", "RETENTION", "OPERATIONS", "DEALS"] as const;
export type CeoDomain = (typeof CEO_DOMAINS)[number];

export const CEO_DECISION_STATUSES = [
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
  "ROLLED_BACK",
] as const;
export type CeoDecisionStatus = (typeof CEO_DECISION_STATUSES)[number];

export const CEO_RUN_TYPES = ["MANUAL", "SCHEDULED"] as const;
export type CeoRunType = (typeof CEO_RUN_TYPES)[number];

export const CEO_POLICY_MODES = ["OFF", "ASSIST", "SAFE_APPROVAL", "AUTO_LOW_RISK"] as const;
export type CeoPolicyMode = (typeof CEO_POLICY_MODES)[number];

export type CeoMarketSignals = {
  leadsLast30d: number;
  leadsPrev30d: number;
  seniorConversionRate30d: number;
  operatorsWithResidences: number;
  brokerAccountsApprox: number;
  operatorOnboardedLast90d: number;
  brokersJoinedLast90d: number;
  churnInactiveBrokersApprox: number;
  inactiveOperatorsApprox: number;
  demandIndex: number;
  outreachReplyRateProxy: number | null;
  seoPagesIndexedApprox: number;
  emailEngagementScore: number | null;
  avgLeadQualityScore: number | null;
  revenueTrend30dProxy: number;
};

export type ProblemOpportunityItem = {
  title: string;
  detail: string;
  severityOrLift: number;
};

export type CeoDecisionProposal = {
  domain: CeoDomain;
  title: string;
  summary: string;
  rationale: string;
  confidence: number | null;
  impactEstimate: number | null;
  requiresApproval: boolean;
  payload: CeoDecisionPayload;
};

/** Discriminated payloads executed only after approval unless marked low-risk draft. */
export type CeoDecisionPayload =
  | { kind: "growth_seo_city_pages"; cities: string[]; notes: string[] }
  | { kind: "growth_cta_shift"; fromLabel: string; toLabel: string; scope: "marketing_landing_only" | "homepage" }
  | { kind: "growth_family_content"; themes: string[] }
  | { kind: "pricing_lead_adjust"; segment: string; relativeDelta: number }
  | { kind: "pricing_featured_adjust"; relativeDelta: number }
  | { kind: "pricing_promo_operator"; headline: string; pctOff: number }
  | {
      kind: "outreach_operator_city";
      city: string;
      rationale: string;
      draftBullets: string[];
      /** Bulk send is never auto-enabled by the engine; explicit true requires approval + policy. */
      bulkSend?: boolean;
    }
  | { kind: "outreach_operator_reengage"; residenceIdsHint: string[] }
  | { kind: "outreach_broker_prospects"; prioritize: "high_score_inactive"; maxList: number }
  | { kind: "retention_broker_email"; cohort: string; draftSubject: string }
  | { kind: "retention_operator_profile"; promptCopy: string }
  | { kind: "retention_credit_offer"; audience: string; pctCredit: number }
  | { kind: "campaign_recommend"; channel: string; headline: string; bullets: string[] }
  | { kind: "operations_note"; note: string };

export type GenerateCeoDecisionsResult = {
  topProblems: ProblemOpportunityItem[];
  topOpportunities: ProblemOpportunityItem[];
  proposedDecisions: CeoDecisionProposal[];
};
