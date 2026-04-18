/**
 * Leads agent — follow-up and pipeline prioritization (aligns with safe CRM signals).
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildLeadsAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const out: GrowthAgentProposal[] = [];

  if (ctx.dueNowCount > 0) {
    out.push({
      id: "leads-due-queue",
      agentId: "leads_agent",
      title: `Clear follow-up due queue (${ctx.dueNowCount} due now)`,
      description: "Internal follow-up state shows items due — broker attention before new acquisition.",
      domain: "leads",
      impact: ctx.dueNowCount >= 6 ? "high" : "medium",
      confidence: 0.64,
      priorityScore: ctx.dueNowCount >= 6 ? 82 : 74,
      rationale: "Derived from sampled follow-up queue — no outbound auto-send.",
      requiresHumanReview: false,
      createdAt: now,
    });
  }

  if (ctx.hotLeadCount >= 4) {
    out.push({
      id: "leads-hot-volume",
      agentId: "leads_agent",
      title: "High hot / high-score lead volume",
      description: "Prioritize routing and capacity — aligns with CRM hot tier and score thresholds.",
      domain: "leads",
      impact: "high",
      confidence: 0.58,
      priorityScore: 76,
      rationale: "Count-based heuristic from CRM read-only aggregates.",
      createdAt: now,
    });
  }

  if (ctx.crmLeadTotal < 5) {
    out.push({
      id: "leads-thin-pipeline",
      agentId: "leads_agent",
      title: "Thin CRM pipeline for learning",
      description: "Low lead count reduces confidence in prioritization — grow intake carefully.",
      domain: "leads",
      impact: "low",
      confidence: 0.45,
      priorityScore: 44,
      rationale: "crmLeadTotal below small-sample threshold.",
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "leads-stable",
      agentId: "leads_agent",
      title: "No urgent follow-up pressure in sampled queue",
      description: "Due-now count is zero or snapshot empty — still monitor CRM daily.",
      domain: "leads",
      impact: "low",
      confidence: 0.48,
      priorityScore: 46,
      rationale: "Default advisory when no backlog signals fire.",
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
