/**
 * Governance agent — maps governance decision to human-review proposals (no enforcement).
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildGovernanceAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const g = ctx.governance;
  const out: GrowthAgentProposal[] = [];

  if (!g) {
    out.push({
      id: "gov-off",
      agentId: "governance_agent",
      title: "Governance layer unavailable or disabled",
      description: "Enable FEATURE_GROWTH_GOVERNANCE_V1 for risk/freeze/escalation signals.",
      domain: "governance",
      impact: "low",
      confidence: 0.4,
      priorityScore: 40,
      rationale: "No GrowthGovernanceDecision in context.",
      createdAt: now,
    });
    return out;
  }

  out.push({
    id: "gov-status",
    agentId: "governance_agent",
    title: `Governance status: ${g.status.replace(/_/g, " ")}`,
    description: "Advisory classification — existing safe gating remains authoritative.",
    domain: "governance",
    impact: g.status === "human_review_required" || g.status === "freeze_recommended" ? "high" : "medium",
    confidence: 0.78,
    priorityScore: g.status === "human_review_required" ? 92 : 78,
    rationale: "Snapshot from evaluateGrowthGovernance — no automatic domain toggles.",
    requiresHumanReview: true,
    blockers: g.blockedDomains.length ? [`Blocked domains: ${g.blockedDomains.join(", ")}`] : undefined,
    createdAt: now,
  });

  for (let i = 0; i < Math.min(2, g.topRisks.length); i++) {
    const r = g.topRisks[i]!;
    out.push({
      id: `gov-risk-${r.id}`,
      agentId: "governance_agent",
      title: `Risk: ${r.title.slice(0, 100)}`,
      description: r.description.slice(0, 220),
      domain: "governance",
      impact: r.severity === "high" ? "high" : "medium",
      confidence: 0.72,
      priorityScore: r.severity === "high" ? 88 : 72,
      rationale: r.reason,
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
