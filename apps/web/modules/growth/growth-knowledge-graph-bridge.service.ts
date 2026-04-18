/**
 * Compact advisory strings for Mission Control / Executive / Strategy surfaces.
 * Does not override priorities — read-only narrative layer.
 */

import type { GrowthKnowledgeGraph } from "./growth-knowledge-graph.types";
import {
  findConflictingDecisionPairs,
  findRecurringBlockerCluster,
  findWinningPatternCluster,
} from "./growth-knowledge-graph-query.service";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Non-authoritative insight lines derived from the graph summary and clusters.
 */
export function buildKnowledgeGraphInsights(graph: GrowthKnowledgeGraph): string[] {
  const out: string[] = [];
  const { summary } = graph;

  if (summary.recurringBlockers.length) {
    out.push(`Recurring blocker themes: ${summary.recurringBlockers.slice(0, 3).join("; ")}`);
  }
  if (summary.repeatedWinners.length) {
    out.push(`Repeated winning signals: ${summary.repeatedWinners.slice(0, 3).join("; ")}`);
  }
  if (summary.dominantThemes.length) {
    out.push(`Dominant themes: ${summary.dominantThemes.slice(0, 5).join(", ")}`);
  }

  const blockCluster = findRecurringBlockerCluster(graph);
  const blockText = blockCluster.map((n) => norm(n.title)).join(" ");
  if (blockCluster.length >= 2) {
    if (/follow|delay|response|backlog/.test(blockText)) {
      out.push(
        "Recurring blocker cluster around follow-up or response delays — align capacity before scaling acquisition (advisory).",
      );
    } else {
      out.push(
        `Blocker cluster (${blockCluster.length} nodes) — review follow-up and funnel capacity together (advisory).`,
      );
    }
  }

  const winCluster = findWinningPatternCluster(graph);
  const campaignNodes = graph.nodes.filter((n) => n.type === "campaign");
  if (winCluster.length >= 2 && campaignNodes.length >= 1) {
    const c0 = campaignNodes[0]!.title.replace(/^campaign:\s*/i, "").trim().slice(0, 48);
    out.push(
      c0
        ? `Winning pattern cluster may be concentrated around campaign “${c0}” — validate before scaling spend (advisory).`
        : `Winning pattern cluster (${winCluster.length} nodes) — double down cautiously after validation (advisory).`,
    );
  } else if (winCluster.length >= 2) {
    out.push(`Winning pattern cluster (${winCluster.length} nodes) — double down cautiously after validation (advisory).`);
  }

  const conflicts = findConflictingDecisionPairs(graph);
  const govConflict = graph.edges.find(
    (e) => e.type === "conflicts_with" && graph.nodes.find((n) => n.id === e.fromId)?.source === "governance",
  );
  if (govConflict) {
    out.push("Conflict between scaling or acquisition emphasis and governance caution — reconcile in review (advisory).");
  } else if (conflicts.length) {
    const c = conflicts[0]!;
    out.push(`Conflict edge: ${c.a.title.slice(0, 80)} ↔ ${c.b.title.slice(0, 80)} (${c.edge.type}).`);
  }

  const opFollow = graph.nodes.find(
    (n) => n.type === "operator_decision" && /follow|response|reply/.test(norm(n.title)),
  );
  if (opFollow) {
    out.push("Operator preference repeatedly favors follow-up-first work — consider sequencing vs content experiments (advisory).");
  }

  return out.slice(0, 8);
}
