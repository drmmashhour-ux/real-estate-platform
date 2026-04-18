/**
 * CRO agent — advisory improvements from fusion CRO signals + funnel problem themes.
 */

import type { AgentCoordinationContext, GrowthAgentProposal } from "../growth-agents.types";

export function buildCroAgentProposals(ctx: AgentCoordinationContext): GrowthAgentProposal[] {
  const now = new Date().toISOString();
  const out: GrowthAgentProposal[] = [];
  const fs = ctx.fusionSummary;

  const croSigs = fs?.grouped?.cro ?? [];
  for (let i = 0; i < Math.min(2, croSigs.length); i++) {
    const s = croSigs[i]!;
    out.push({
      id: `cro-fus-${s.id}`.slice(0, 80),
      agentId: "cro_agent",
      title: `CRO: ${s.title.slice(0, 100)}`,
      description: s.description.slice(0, 240),
      domain: "cro",
      impact: s.impact,
      confidence: s.confidence,
      priorityScore: s.priorityScore,
      rationale: "From fusion CRO bucket — validate in product analytics before experiments.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  const problems = fs?.topProblems ?? [];
  for (let i = 0; i < Math.min(2, problems.length); i++) {
    const p = problems[i]!;
    if (p.toLowerCase().includes("conversion") || p.toLowerCase().includes("cta") || p.toLowerCase().includes("funnel")) {
      out.push({
        id: `cro-prob-${i}-${p.slice(0, 20)}`,
        agentId: "cro_agent",
        title: `Address theme: ${p.slice(0, 100)}`,
        description: "Cross-source fusion problem — CRO experiments remain approval-gated.",
        domain: "cro",
        impact: "high",
        confidence: 0.58,
        priorityScore: 72,
        rationale: "Keyword match on conversion/CTA/funnel in fusion top problems.",
        requiresHumanReview: true,
        createdAt: now,
      });
    }
  }

  const ins = ctx.adsInsights;
  if (ins && ins.health === "WEAK" && ctx.leadsToday < 1) {
    out.push({
      id: "cro-weak-funnel",
      agentId: "cro_agent",
      title: "Strengthen capture before traffic experiments",
      description: "Early conversion intake is weak — CRO should precede aggressive acquisition tests.",
      domain: "cro",
      impact: "high",
      confidence: 0.52,
      priorityScore: 70,
      rationale: "Heuristic from weak ads health + low same-day early leads.",
      requiresHumanReview: true,
      createdAt: now,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "cro-no-signals",
      agentId: "cro_agent",
      title: "No CRO fusion signals in this cycle",
      description: "Enable Growth Fusion or add funnel telemetry for richer CRO proposals.",
      domain: "cro",
      impact: "low",
      confidence: 0.4,
      priorityScore: 40,
      rationale: "Fusion summary empty or CRO bucket empty.",
      createdAt: now,
    });
  }

  return out.slice(0, 5);
}
