/**
 * Builds unified SwarmDecisionBundle from proposals + negotiation results.
 */
import { swarmSystemFlags } from "@/config/feature-flags";
import type {
  SwarmAgentId,
  SwarmAggregateScores,
  SwarmConflict,
  SwarmDecisionBundle,
  SwarmDecisionBundleGrouped,
  SwarmNegotiationResult,
  SwarmNegotiationStatus,
  SwarmProposal,
} from "./swarm-system.types";

function groupKeyForStatus(s: SwarmNegotiationStatus): keyof SwarmDecisionBundleGrouped {
  switch (s) {
    case "proceed":
      return "proceed";
    case "proceed_with_caution":
      return "caution";
    case "monitor_only":
      return "monitor";
    case "defer":
      return "defer";
    case "blocked":
      return "blocked";
    case "require_human_review":
      return "human_review";
    default:
      return "monitor";
  }
}

function emptyGrouped(): SwarmDecisionBundleGrouped {
  return { proceed: [], caution: [], monitor: [], defer: [], blocked: [], human_review: [] };
}

export function buildSwarmDecisionBundle(input: {
  proposals: SwarmProposal[];
  conflicts: SwarmConflict[];
  negotiationResults: SwarmNegotiationResult[];
  scores: SwarmAggregateScores;
  agentsRun: SwarmAgentId[];
  readinessSummary: string;
  /** When true — Phase B overlay was applied (presentation copy only). Base bundles omit this. */
  influenceApplied?: boolean;
}): SwarmDecisionBundle {
  const grouped = emptyGrouped();
  const byId = new Map(input.negotiationResults.map((n) => [n.proposalId, n]));

  for (const p of input.proposals) {
    const n = byId.get(p.id);
    const status: SwarmNegotiationStatus = n?.status ?? "monitor_only";
    grouped[groupKeyForStatus(status)].push(p);
  }

  const primarySurface: "none" | "fusion" | "swarm" = swarmSystemFlags.swarmAgentPrimaryV1 ? "swarm" : "none";
  const influenceApplied = input.influenceApplied === true;

  return {
    opportunities: [...input.proposals],
    groupedBy: grouped,
    conflicts: input.conflicts,
    negotiationResults: input.negotiationResults,
    scores: input.scores,
    meta: {
      agentsRun: input.agentsRun,
      agreementScore: input.scores.agreementScore,
      conflictCount: input.conflicts.length,
      evidenceQuality: input.scores.evidenceScore,
      readinessSummary: input.readinessSummary,
      primarySurface,
      influenceApplied,
    },
  };
}
