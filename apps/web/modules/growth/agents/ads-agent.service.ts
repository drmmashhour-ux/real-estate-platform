/**
 * Ads agent — advisory proposals from existing UTM / early-conversion insights (manual-only).
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

function pid(s: string): string {
  return `ads-${s.slice(0, 48).replace(/\s+/g, "-").toLowerCase()}`;
}

export function buildAdsAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const out: GrowthAgentProposal[] = [];
  const now = new Date().toISOString();
  const ins = ctx.adsInsights;
  if (!ins) {
    return [
      {
        id: "ads-no-snapshot",
        agentId: "ads_agent",
        title: "UTM early-conversion data unavailable",
        description: "Ads agent could not load paid funnel snapshot — treat proposals as informational.",
        domain: "ads",
        impact: "low",
        confidence: 0.35,
        priorityScore: 42,
        rationale: "Missing early_conversion_lead aggregate for this cycle.",
        requiresHumanReview: true,
        createdAt: now,
      },
    ];
  }

  for (let i = 0; i < Math.min(2, ins.opportunities.length); i++) {
    const line = ins.opportunities[i]!;
    out.push({
      id: pid(`opp-${i}-${line}`),
      agentId: "ads_agent",
      title: `Consider scaling: ${line.slice(0, 90)}`,
      description: "Derived from existing paid funnel opportunity lines — no API spend changes.",
      domain: "ads",
      impact: ins.health === "STRONG" ? "high" : "medium",
      confidence: 0.62,
      priorityScore: ins.health === "STRONG" ? 78 : 68,
      rationale: "Opportunity string from computePaidFunnelAdsInsights — operator validates before any campaign action.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  for (let i = 0; i < Math.min(2, ins.problems.length); i++) {
    const line = ins.problems[i]!;
    out.push({
      id: pid(`prob-${i}-${line}`),
      agentId: "ads_agent",
      title: `Review / pause pressure: ${line.slice(0, 90)}`,
      description: "Campaign underperformance signal — manual review in Marketing Studio / ROI reports.",
      domain: "ads",
      impact: "medium",
      confidence: 0.55,
      priorityScore: 58,
      rationale: "Problem line from UTM early-conversion analyzer — advisory only.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "ads-band-stable",
      agentId: "ads_agent",
      title: `Paid funnel band: ${ins.health}`,
      description: "No standout opportunities or problems in current snapshot window.",
      domain: "ads",
      impact: "low",
      confidence: 0.5,
      priorityScore: 48,
      rationale: `Health ${ins.health} with no extra problem/opportunity lines.`,
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
