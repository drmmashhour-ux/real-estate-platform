/**
 * Ads agent — read-only Ads V8 diagnostics; proposals only.
 */
import { getAdsAutopilotV8MonitoringSnapshot } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.monitoring";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { bounded01, emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runAdsAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("ads", "performance", { warning: "Swarm master flag off." });
  }
  try {
    const snap = getAdsAutopilotV8MonitoringSnapshot();
    const t = input.generatedAt;
    const proposals: SwarmProposal[] = [];
    if (snap.v8PrimaryFallbackCount > 2) {
      proposals.push({
        id: proposalId("ads", "reduce_fallbacks"),
        agentId: "ads",
        role: "performance",
        sourceSystems: ["ads_v8"],
        recommendationType: "reduce",
        confidence: bounded01(0.55 + snap.v8PrimarySuccessCount * 0.01),
        priority: 0.62,
        risk: bounded01(0.45 + snap.v8PrimaryFallbackCount * 0.03),
        evidenceQuality: 0.5,
        blockers: [],
        dependencies: ["stable_v8_primary_path"],
        rationale: "Elevated primary-path fallbacks in monitoring — prefer conservative scaling until stable.",
        suggestedNextAction: "Review recentPrimaryFallbackReasons in Ads V8 monitoring (read-only).",
        freshnessAt: t,
      });
    } else if (snap.v8RolloutPathRuns > snap.legacyPathRuns && snap.v8PrimarySuccessCount >= snap.v8PrimaryFallbackCount) {
      proposals.push({
        id: proposalId("ads", "scale_winners"),
        agentId: "ads",
        role: "performance",
        sourceSystems: ["ads_v8"],
        targetEntity: { type: "campaign_path", id: snap.lastPrimaryPathLabel },
        recommendationType: "scale",
        confidence: 0.62,
        priority: 0.58,
        risk: 0.38,
        evidenceQuality: 0.55,
        blockers: [],
        dependencies: [],
        rationale: "V8 rollout activity exceeds legacy with balanced success/fallback — candidate to scale cautiously.",
        suggestedNextAction: "Validate budgets and audience fit before any live scale (manual).",
        freshnessAt: t,
      });
    } else {
      proposals.push({
        id: proposalId("ads", "monitor_mix"),
        agentId: "ads",
        role: "performance",
        sourceSystems: ["ads_v8"],
        recommendationType: "monitor",
        confidence: 0.5,
        priority: 0.45,
        risk: 0.42,
        evidenceQuality: 0.48,
        blockers: [],
        dependencies: [],
        rationale: "Mixed legacy vs V8 signals — hold scale changes; continue observation.",
        suggestedNextAction: "Keep monitoring dashboard as primary signal source.",
        freshnessAt: t,
      });
    }
    return {
      agentId: "ads",
      role: "performance",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks:
        snap.shadowPipelineFailures > 2
          ? [
              {
                id: "ads_r_shadow_fail",
                agentId: "ads",
                severity: "medium",
                summary: "Shadow pipeline failures observed in process-local monitoring.",
              },
            ]
          : [],
      warnings: [],
    };
  } catch (e) {
    return emptyAgentOutput("ads", "performance", {
      failureReason: e instanceof Error ? e.message : String(e),
    });
  }
}
