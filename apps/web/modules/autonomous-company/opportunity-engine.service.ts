/**
 * Opportunity engine — ranked candidates (advisory scores only).
 */
import type { OpportunityEngineOutput, RankedOpportunity, StrategyEngineOutput } from "./autonomous-company.types";

function narrowDomain(d: string): RankedOpportunity["domain"] {
  if (d === "ads" || d === "cro" || d === "marketplace") return d;
  return "behavior";
}

function scoreOpp(o: Omit<RankedOpportunity, "score">): RankedOpportunity {
  const score = 0.35 * o.impact + 0.25 * o.confidence + 0.2 * (1 - o.effort) + 0.2 * o.urgency;
  return { ...o, score: Math.max(0, Math.min(1, score)) };
}

export function rankOpportunitiesFromStrategy(strategy: StrategyEngineOutput | null): OpportunityEngineOutput {
  const notes: string[] = [];
  if (!strategy) {
    notes.push("Strategy unavailable — opportunities list minimal.");
    return { ranked: [], notes };
  }

  const raw: Omit<RankedOpportunity, "score">[] = [];

  for (const o of strategy.opportunities) {
    raw.push({
      id: `opp_${o.id}`,
      title: o.summary.slice(0, 120),
      domain: narrowDomain(o.domain),
      impact: o.domain === "cro" ? 0.72 : 0.55,
      confidence: 0.5,
      effort: 0.45,
      urgency: o.domain === "cro" ? 0.7 : 0.5,
      rationale: o.summary,
    });
  }

  raw.push({
    id: "opp_fusion_consensus",
    title: "Improve cross-system consensus on top conflicts",
    domain: "fusion",
    impact: 0.6,
    confidence: 0.55,
    effort: 0.5,
    urgency: 0.55,
    rationale: "Derived from strategy priorities — advisory only.",
  });

  const ranked = raw.map(scoreOpp).sort((a, b) => b.score - a.score);
  return { ranked, notes };
}
