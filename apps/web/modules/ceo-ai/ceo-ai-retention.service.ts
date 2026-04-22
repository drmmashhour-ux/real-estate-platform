import type { CeoDecisionProposal, CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

/** Detection + drafts — incentives require explicit approval. */

export function proposeRetentionDecisions(signals: CeoMarketSignals): CeoDecisionProposal[] {
  const out: CeoDecisionProposal[] = [];

  if (signals.churnInactiveBrokersApprox >= 10) {
    out.push({
      domain: "RETENTION",
      title: "Broker reactivation nurture (draft)",
      summary:
        "Send segmented win-back drip emphasizing new operator inventory + faster lead routing SLAs.",
      rationale: `${signals.churnInactiveBrokersApprox}+ brokers flagged inactive vs active funnel volume.`,
      confidence: 0.62,
      impactEstimate: 0.04,
      requiresApproval: false,
      payload: {
        kind: "retention_broker_email",
        cohort: "inactive_90d_plus",
        draftSubject: "Still helping families move into care?",
      },
    });
  }

  if (signals.inactiveOperatorsApprox >= 6) {
    out.push({
      domain: "RETENTION",
      title: "Prompt operators to finish profiles",
      summary:
        "Surface checklist modal + AM assist for residences missing pricing or verification badges.",
      rationale: "Enough halfway onboarded operators to materially affect conversion.",
      confidence: 0.59,
      impactEstimate: 0.035,
      requiresApproval: false,
      payload: {
        kind: "retention_operator_profile",
        promptCopy: "Finish verification to unlock prioritized placement in-family matching.",
      },
    });
  }

  if (signals.revenueTrend30dProxy < -0.06 && signals.churnInactiveBrokersApprox > 12) {
    out.push({
      domain: "RETENTION",
      title: "Controlled credit incentive for churn-risk tier",
      summary:
        "Offer small platform credits (gated budget) before hard churn — finance review required.",
      rationale: `Revenue momentum proxy negative (${(signals.revenueTrend30dProxy * 100).toFixed(1)}%).`,
      confidence: 0.54,
      impactEstimate: 0.07,
      requiresApproval: true,
      payload: {
        kind: "retention_credit_offer",
        audience: "broker_churn_band_A",
        pctCredit: 10,
      },
    });
  }

  return out;
}
