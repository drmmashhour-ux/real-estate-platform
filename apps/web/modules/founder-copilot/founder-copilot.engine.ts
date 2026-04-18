import { buildCompanyInsights } from "../company-insights/company-insights.service";
import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";
import { recommendFounderActions } from "./founder-action-recommender.service";
import type { FounderCopilotRunResult } from "./founder-copilot.types";
import { answerFounderQuestion } from "./founder-question-answerer.service";

export async function runFounderCopilotEngine(
  snapshot: FounderIntelligenceSnapshot,
  question?: string,
): Promise<FounderCopilotRunResult> {
  const { insights } = await buildCompanyInsights(snapshot);
  const actions = recommendFounderActions(snapshot, insights);

  const risks = snapshot.deteriorating.map(
    (d) => `${d.metric}: ${d.previous ?? "n/a"} → ${d.current ?? "n/a"}`,
  );
  const opportunities = snapshot.improving.map(
    (d) => `${d.metric}: ${d.previous ?? "n/a"} → ${d.current ?? "n/a"}`,
  );

  const answer = question?.trim()
    ? answerFounderQuestion(question, snapshot, insights)
    : null;

  return {
    title: "État résidentiel (agrégats LECIPM)",
    summary: `${snapshot.current.scopeLabel} — ${snapshot.current.range.label}. Dossiers actifs ${snapshot.current.deals.active}.`,
    topPriorities: actions.slice(0, 8).map((a) => ({
      title: a.label,
      evidence: a.evidenceRefs,
    })),
    risks: risks.slice(0, 8),
    opportunities: opportunities.slice(0, 8),
    answer,
  };
}
