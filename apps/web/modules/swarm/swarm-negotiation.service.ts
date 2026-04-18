/**
 * Swarm negotiation — advisory status per proposal; no execution.
 */
import { swarmSystemFlags } from "@/config/feature-flags";
import type {
  SwarmAgentId,
  SwarmConflict,
  SwarmNegotiationResult,
  SwarmNegotiationStatus,
  SwarmProposal,
} from "./swarm-system.types";

function statusFromSignals(p: SwarmProposal, tension: boolean): SwarmNegotiationStatus {
  if (p.blockers.length > 0 || p.recommendationType === "block") return "blocked";
  if (tension && p.risk > 0.65) return "require_human_review";
  if (p.risk > 0.72 || p.evidenceQuality < 0.35) return "defer";
  if (p.risk > 0.55 || p.evidenceQuality < 0.45) return "proceed_with_caution";
  if (p.recommendationType === "monitor" || p.recommendationType === "caution") return "monitor_only";
  if (p.recommendationType === "defer") return "defer";
  return "proceed";
}

export function detectSwarmConflicts(proposals: SwarmProposal[]): SwarmConflict[] {
  const conflicts: SwarmConflict[] = [];
  let idx = 0;

  const scale = proposals.filter((p) => p.recommendationType === "scale");
  const reduce = proposals.filter((p) => p.recommendationType === "reduce");
  if (scale.length && reduce.length) {
    conflicts.push({
      id: `cf_${idx++}`,
      proposalIds: [...scale.map((s) => s.id), ...reduce.map((r) => r.id)],
      agents: [...new Set([...scale, ...reduce].map((p) => p.agentId))] as SwarmAgentId[],
      category: "scale_vs_reduce",
      summary: "Some agents favor scale while others favor reduction — review trade-offs.",
    });
  }

  const exec = proposals.filter((p) => p.agentId === "operator" && p.recommendationType === "execute");
  const block = proposals.filter((p) => p.agentId === "platform_core" && p.recommendationType === "block");
  if (exec.length && block.length) {
    conflicts.push({
      id: `cf_${idx++}`,
      proposalIds: [...exec.map((e) => e.id), ...block.map((b) => b.id)],
      agents: ["operator", "platform_core"],
      category: "execute_vs_blocked",
      summary: "Execution intent conflicts with platform dependency/blocked signals.",
    });
  }

  const adsScale = proposals.some((p) => p.agentId === "ads" && p.recommendationType === "scale");
  const brainCaution = proposals.some((p) => p.agentId === "brain" && p.recommendationType === "caution");
  if (adsScale && brainCaution) {
    conflicts.push({
      id: `cf_${idx++}`,
      proposalIds: proposals.filter((p) => p.agentId === "ads" || p.agentId === "brain").map((p) => p.id),
      agents: ["ads", "brain"],
      category: "scale_vs_evidence_caution",
      summary: "Ads scaling signal vs Brain caution — negotiate evidence before acting.",
    });
  }

  return conflicts;
}

export function negotiateProposals(proposals: SwarmProposal[], conflicts: SwarmConflict[]): SwarmNegotiationResult[] {
  if (!swarmSystemFlags.swarmAgentNegotiationV1) {
    return proposals.map((p) => ({
      proposalId: p.id,
      status: "monitor_only" as SwarmNegotiationStatus,
      notes: ["Negotiation layer disabled — defaulting to monitor_only advisory."],
    }));
  }

  const tension = conflicts.length > 0;
  const out: SwarmNegotiationResult[] = [];

  for (const p of proposals) {
    let status = statusFromSignals(p, tension);
    const notes: string[] = [];
    if (tension && status === "proceed") {
      status = "proceed_with_caution";
      notes.push("Cross-agent tension present — elevated to caution.");
    }
    out.push({
      proposalId: p.id,
      status,
      notes,
      dominantAgentId: p.agentId,
    });
  }

  return out;
}
