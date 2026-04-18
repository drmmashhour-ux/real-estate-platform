/**
 * Shared helpers for swarm agents — no side effects.
 */
import { swarmSystemFlags } from "@/config/feature-flags";
import type { SwarmAgentId, SwarmAgentOutput, SwarmAgentRole, SwarmProposal, SwarmRisk } from "./swarm-system.types";

export function isSwarmAgentLayerEnabled(): boolean {
  return swarmSystemFlags.swarmSystemV1;
}

export function emptyAgentOutput(
  agentId: SwarmAgentId,
  role: SwarmAgentRole,
  opts?: { warning?: string; failureReason?: string },
): SwarmAgentOutput {
  const warnings = opts?.warning ? [opts.warning] : [];
  return {
    agentId,
    role,
    proposals: [],
    risks: [],
    warnings,
    failureReason: opts?.failureReason,
  };
}

export function proposalId(agent: SwarmAgentId, suffix: string): string {
  return `swarm_${agent}_${suffix}`;
}

export function bounded01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

export function mapProposalsWithFreshness(proposals: SwarmProposal[], freshnessAt: string): SwarmProposal[] {
  return proposals.map((p) => ({ ...p, freshnessAt }));
}
