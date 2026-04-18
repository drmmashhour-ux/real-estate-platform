/**
 * Fusion agent — cross-source priorities from existing fusion prioritizer output.
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildFusionAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const out: GrowthAgentProposal[] = [];
  const acts = ctx.fusionActions;

  for (let i = 0; i < Math.min(4, acts.length); i++) {
    const a = acts[i]!;
    out.push({
      id: `fus-${a.id}`.slice(0, 96),
      agentId: "fusion_agent",
      title: a.title.slice(0, 120),
      description: a.description.slice(0, 260),
      domain: "fusion",
      impact: a.impact,
      confidence: a.confidence,
      priorityScore: a.priorityScore,
      rationale: a.why.slice(0, 300),
      requiresHumanReview: a.executionMode === "approval_required",
      blockers: a.executionMode === "manual_only" ? ["manual_only execution mode"] : undefined,
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "fusion-empty",
      agentId: "fusion_agent",
      title: "No fusion actions in this cycle",
      description: "Enable FEATURE_GROWTH_FUSION_V1 and ensure fusion snapshot can build.",
      domain: "fusion",
      impact: "low",
      confidence: 0.42,
      priorityScore: 42,
      rationale: "prioritizeGrowthFusionActions returned empty — partial data safe.",
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
