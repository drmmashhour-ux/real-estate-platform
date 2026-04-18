/**
 * Brain agent — trust/risk/evidence summary from Brain V8 shadow monitoring (read-only).
 */
import { getBrainV8ShadowMonitoringSnapshot } from "@/modules/platform-core/brain-v8-shadow-monitoring.service";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { bounded01, emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runBrainAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("brain", "intelligence");
  }
  try {
    const snap = getBrainV8ShadowMonitoringSnapshot();
    const t = input.generatedAt;
    const failRate =
      snap.passesRun > 0 ? (snap.persistFail + snap.snapshotFail + snap.auditEmitFail) / snap.passesRun : 0;
    const proposals: SwarmProposal[] = [];
    if (failRate > 0.2 || snap.consecutiveEmptyPasses > 3) {
      proposals.push({
        id: proposalId("brain", "caution_instability"),
        agentId: "brain",
        role: "intelligence",
        sourceSystems: ["brain_v8"],
        recommendationType: "caution",
        confidence: 0.48,
        priority: 0.55,
        risk: bounded01(0.5 + failRate),
        evidenceQuality: bounded01(0.55 - failRate * 0.5),
        blockers: [],
        dependencies: [],
        rationale: "Shadow monitoring shows elevated failure/empty signals — prefer caution on dependent automation.",
        suggestedNextAction: "Review Brain shadow persistence/snapshot health before scaling dependent systems.",
        freshnessAt: t,
      });
    } else {
      proposals.push({
        id: proposalId("brain", "neutral"),
        agentId: "brain",
        role: "intelligence",
        sourceSystems: ["brain_v8"],
        recommendationType: "monitor",
        confidence: 0.55,
        priority: 0.42,
        risk: 0.4,
        evidenceQuality: 0.58,
        blockers: [],
        dependencies: [],
        rationale: "Monitoring within expected variance band for shadow outcomes.",
        suggestedNextAction: "Continue observation; no Brain-side action implied.",
        freshnessAt: t,
      });
    }
    return {
      agentId: "brain",
      role: "intelligence",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks: [],
      warnings: [],
    };
  } catch (e) {
    return emptyAgentOutput("brain", "intelligence", { failureReason: e instanceof Error ? e.message : String(e) });
  }
}
