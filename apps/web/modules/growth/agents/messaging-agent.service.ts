/**
 * Messaging agent — draft-only suggestions; never auto-send.
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildMessagingAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const out: GrowthAgentProposal[] = [];

  if (ctx.messagingAssistEnabled && ctx.dueNowCount > 0) {
    out.push({
      id: "msg-drafts-due",
      agentId: "messaging_agent",
      title: "Use messaging assist drafts for due follow-ups",
      description: "Generate draft replies in CRM — operator sends manually; no auto-send.",
      domain: "messaging",
      impact: ctx.dueNowCount >= 4 ? "high" : "medium",
      confidence: 0.6,
      priorityScore: 71,
      rationale: "Messaging assist is draft-only per platform policy.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (ctx.hotLeadCount >= 2 && ctx.messagingAssistEnabled) {
    out.push({
      id: "msg-hot-priority",
      agentId: "messaging_agent",
      title: "Prioritize tone-consistent drafts for hot leads",
      description: "Align reply drafts with high-intent tier — still manual send.",
      domain: "messaging",
      impact: "medium",
      confidence: 0.52,
      priorityScore: 63,
      rationale: "Hot lead volume present with messaging assist enabled.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "msg-disabled-or-quiet",
      agentId: "messaging_agent",
      title: "Messaging assist quiet this cycle",
      description:
        ctx.messagingAssistEnabled === false
          ? "Enable FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1 for draft suggestions."
          : "No due follow-ups or hot-tier emphasis in this snapshot.",
      domain: "messaging",
      impact: "low",
      confidence: 0.42,
      priorityScore: 41,
      rationale: "Informational — no outbound automation.",
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
