/**
 * Swarm health / observability summary — warnings are observational only.
 */
import { swarmSystemFlags } from "@/config/feature-flags";
import type {
  SwarmAgentOutput,
  SwarmDecisionBundle,
  SwarmHealthSummary,
  SwarmNegotiationStatus,
} from "./swarm-system.types";

export function buildSwarmHealthSummary(
  agentOutputs: SwarmAgentOutput[],
  bundle: SwarmDecisionBundle,
): SwarmHealthSummary {
  const perAgentFailureCount: Record<string, number> = {};
  for (const o of agentOutputs) {
    if (o.failureReason) {
      perAgentFailureCount[o.agentId] = (perAgentFailureCount[o.agentId] ?? 0) + 1;
    }
  }

  const negotiationOutcomeCounts: Partial<Record<SwarmNegotiationStatus, number>> = {};
  for (const n of bundle.negotiationResults) {
    negotiationOutcomeCounts[n.status] = (negotiationOutcomeCounts[n.status] ?? 0) + 1;
  }

  const insuff = bundle.opportunities.filter((p) => p.evidenceQuality < 0.4).length;
  const insufficientEvidenceRate = bundle.opportunities.length ? insuff / bundle.opportunities.length : 0;
  const blockedDefer =
    (negotiationOutcomeCounts.blocked ?? 0) +
    (negotiationOutcomeCounts.defer ?? 0) +
    (negotiationOutcomeCounts.require_human_review ?? 0);
  const blockedDeferRate = bundle.opportunities.length ? blockedDefer / bundle.opportunities.length : 0;

  const topDisagreementCategories = bundle.conflicts.map((c) => c.category).slice(0, 5);

  const agentsRun = bundle.meta.agentsRun.length;
  const subsystemCoverageSummary = `${agentsRun}/8 agents`;

  const observationalWarnings: string[] = [];
  if (bundle.opportunities.length === 0) {
    observationalWarnings.push("Empty swarm output while agents ran — check agent failures and subsystem flags.");
  }
  if (bundle.conflicts.length > 4) {
    observationalWarnings.push("Repeated high-severity cross-agent conflicts — review negotiation results.");
  }
  if (insufficientEvidenceRate > 0.45) {
    observationalWarnings.push("High insufficient-evidence rate — downgrade automation confidence.");
  }
  const dominant = bundle.opportunities.filter((p) => p.agentId === "ads").length;
  if (dominant / Math.max(bundle.opportunities.length, 1) > 0.5 && bundle.opportunities.length > 4) {
    observationalWarnings.push("Ads agent dominates proposal volume — verify other agents are enabled.");
  }
  if (swarmSystemFlags.swarmAgentPersistenceV1) {
    observationalWarnings.push(
      "Persistence flag on — DB persistence not wired; use logs and API consumers until optional store is added.",
    );
  }

  return {
    agentsRun,
    proposalCount: bundle.opportunities.length,
    conflictCount: bundle.conflicts.length,
    negotiationOutcomeCounts,
    insufficientEvidenceRate,
    blockedDeferRate,
    topDisagreementCategories,
    perAgentFailureCount,
    subsystemCoverageSummary,
    observationalWarnings,
  };
}
