/**
 * Content agent — draft generation proposals only; no publishing.
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildContentAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const out: GrowthAgentProposal[] = [];

  if (ctx.contentAssistEnabled) {
    out.push({
      id: "content-studio-drafts",
      agentId: "content_agent",
      title: "Prepare listing / outreach drafts in Content Studio",
      description: "Use Growth Content Studio for copy drafts — publishing stays manual and reviewed.",
      domain: "content",
      impact: "medium",
      confidence: 0.55,
      priorityScore: 60,
      rationale: "Content assist produces drafts only; aligns with existing growth policy.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (ctx.adsInsights?.opportunities.length && ctx.contentAssistEnabled) {
    out.push({
      id: "content-supports-ads",
      agentId: "content_agent",
      title: "Align landing copy with winning UTM themes",
      description: "Cross-link content drafts to opportunity lines from ads insights — advisory pairing.",
      domain: "content",
      impact: "medium",
      confidence: 0.5,
      priorityScore: 57,
      rationale: "Wraps existing opportunity strings — no Meta/Google API calls.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "content-idle",
      agentId: "content_agent",
      title: "Content assist off or no paired signals",
      description: "Enable content assist flag for draft workflows in this hub.",
      domain: "content",
      impact: "low",
      confidence: 0.38,
      priorityScore: 38,
      rationale: "No draft proposals without content assist or pairing context.",
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
