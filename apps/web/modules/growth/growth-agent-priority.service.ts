/**
 * Resolves top agent proposals — ordering only; no execution.
 */

import type { GrowthAgentAlignment, GrowthAgentConflict, GrowthAgentProposal } from "./growth-agents.types";

function baseScore(p: GrowthAgentProposal): number {
  return p.priorityScore ?? (p.impact === "high" ? 72 : p.impact === "medium" ? 58 : 45);
}

export function resolveGrowthAgentPriorities(
  proposals: GrowthAgentProposal[],
  conflicts: GrowthAgentConflict[],
  alignments: GrowthAgentAlignment[],
): GrowthAgentProposal[] {
  const conflictIds = new Set<string>();
  for (const c of conflicts) {
    if (c.severity === "high") {
      for (const id of c.proposalIds) conflictIds.add(id);
    }
  }

  const alignmentBoost = new Map<string, number>();
  for (const a of alignments) {
    const bump = a.confidence * 6;
    for (const id of a.proposalIds) {
      alignmentBoost.set(id, (alignmentBoost.get(id) ?? 0) + bump);
    }
  }

  const scored = proposals.map((p) => {
    let s = baseScore(p);
    s += alignmentBoost.get(p.id) ?? 0;
    if (conflictIds.has(p.id)) s -= 18;
    if (p.requiresHumanReview) s += 3;
    return { p, s };
  });

  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 5).map((x) => x.p);
}
