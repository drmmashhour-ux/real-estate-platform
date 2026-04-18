import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { CompanyInsight } from "./company-insights.types";
import { labelHypothesis } from "../founder-intelligence/founder-explainer";

/**
 * Non-causal hypotheses only — must remain explicitly labeled; never asserted as fact.
 */
export function buildRootCauseHypotheses(current: CompanyMetricsSnapshot): CompanyInsight[] {
  const out: CompanyInsight[] = [];

  if (current.blockers.blockedDealRequests > 0 && current.velocity.avgResponseTimeHours !== null) {
    out.push({
      insightType: "hypothesis_coordination",
      title: "Hypothèse — coordination documentaire",
      summary: labelHypothesis(
        "Les blocages documentaires peuvent coexister avec des délais de réponse élevés; corrélation non prouvée par ces seuls agrégats.",
      ),
      impactLevel: "medium",
      urgency: "medium",
      evidence: [
        { ref: "blockers.blockedDealRequests", value: current.blockers.blockedDealRequests, nature: "fact" },
        {
          ref: "velocity.avgResponseTimeHours",
          value: current.velocity.avgResponseTimeHours,
          nature: "fact",
        },
        { ref: "hypothesis.disclaimer", value: "non_causal", nature: "inference" },
      ],
      confidence: 0.35,
      category: "execution",
      suggestedActions: [
        {
          label: "Ouvrir la file des demandes BLOCKED pour inspection qualitative.",
          nature: "fact_check",
        },
      ],
    });
  }

  return out;
}
