/**
 * Repeatable loop for depth in the primary segment (Montréal-first).
 * Narrative only — execution lives in CRM, success, and product.
 */

export type BrokerLoopStage = "acquire" | "engage" | "retain";

export type BrokerDominationLoopStep = {
  stage: BrokerLoopStage;
  actions: string[];
  successSignals: string[];
};

export const BROKER_DOMINATION_LOOP: BrokerDominationLoopStep[] = [
  {
    stage: "acquire",
    actions: [
      "Partner-led introductions in Montréal CRE and residential brokerages",
      "Clear ICP: teams already running digital CRM with deal volume",
      "Single value story tied to LECIPM category + measurable deal outcomes",
    ],
    successSignals: [
      "Net new active broker accounts in primary city per week",
      "Time-to-first-deal after signup trending down",
    ],
  },
  {
    stage: "engage",
    actions: [
      "Weekly power-user office hours; async tips in product",
      "Surface AI + pipeline actions that save time (measurable clicks / completions)",
      "Escalation path to product when workflows break",
    ],
    successSignals: [
      "Engagement rate vs. internal baseline (see leadership metrics)",
      "Feature adoption on deal execution modules",
    ],
  },
  {
    stage: "retain",
    actions: [
      "Quarterly business reviews for top-of-book brokers",
      "Retention offers tied to volume and data quality, not unverifiable “best” claims",
      "Churn post-mortems fed back into partnership and onboarding",
    ],
    successSignals: [
      "Trailing retention of active brokers",
      "NPS or qualitative “would recommend” for cohorts",
    ],
  },
];
