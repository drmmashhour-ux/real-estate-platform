import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";
import type { CompanyInsight } from "./company-insights.types";
import { summarizeAnomalies } from "./anomaly-summary.service";
import { buildRootCauseHypotheses } from "./root-cause-hypothesis.service";
import { computeMetricDeltas } from "./trend-comparison.service";

export function synthesizeInsightsFromIntelligence(snapshot: FounderIntelligenceSnapshot): CompanyInsight[] {
  const deltas = computeMetricDeltas(snapshot.current, snapshot.previous);
  const sampleThin =
    snapshot.current.velocity.responseSampleSize < 5 &&
    snapshot.current.velocity.acceptedOfferSampleSize < 5;
  const anomalies = summarizeAnomalies(deltas, sampleThin ? "thin_sample" : undefined);
  const hypotheses = buildRootCauseHypotheses(snapshot.current);

  const backlog: CompanyInsight[] = [];
  if (snapshot.current.compliance.openCases > 0) {
    backlog.push({
      insightType: "compliance_backlog",
      title: "File conformité résidentielle",
      summary: `Cas ouverts recensés: ${snapshot.current.compliance.openCases} (période courante).`,
      impactLevel: snapshot.current.compliance.openCases > 5 ? "high" : "medium",
      urgency: "medium",
      evidence: [{ ref: "compliance.openCases", value: snapshot.current.compliance.openCases, nature: "fact" }],
      confidence: 0.9,
      category: "compliance",
      suggestedActions: [
        { label: "Prioriser revue superviseur selon échéances de closing.", nature: "recommendation" },
      ],
    });
  }

  return [...backlog, ...anomalies, ...hypotheses].slice(0, 24);
}
