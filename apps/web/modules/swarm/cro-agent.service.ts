/**
 * CRO agent — read-only funnel diagnostics; draft/shadow experiment suggestions only.
 */
import { croOptimizationV8Flags } from "@/config/feature-flags";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { bounded01, emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runCroAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("cro", "conversion");
  }
  try {
    if (!croOptimizationV8Flags.croV8AnalysisV1) {
      return {
        agentId: "cro",
        role: "conversion",
        proposals: [],
        risks: [],
        warnings: ["FEATURE_CRO_V8_ANALYSIS_V1 off — CRO bundle not queried."],
      };
    }
    const { runCroV8OptimizationBundle } = await import("@/services/growth/cro-v8-optimization-bridge");
    const bundle = await runCroV8OptimizationBundle({ rangeDays: 14 });
    const t = input.generatedAt;
    if (!bundle) {
      return {
        agentId: "cro",
        role: "conversion",
        proposals: [],
        risks: [],
        warnings: ["CRO bundle unavailable (flag or data)."],
      };
    }

    const topDrop = bundle.dropoffs.reduce((a, b) => (a.gapVsBenchmark >= b.gapVsBenchmark ? a : b));
    const proposals: SwarmProposal[] = [
      {
        id: proposalId("cro", "bottleneck"),
        agentId: "cro",
        role: "conversion",
        sourceSystems: ["cro_v8"],
        targetEntity: { type: "funnel_stage", id: topDrop.id },
        recommendationType: "experiment",
        confidence: bounded01(0.5 + bundle.healthScore / 200),
        priority: 0.65,
        risk: bounded01(0.35 + topDrop.gapVsBenchmark),
        evidenceQuality: 0.52,
        blockers: [],
        dependencies: ["analytics_window"],
        rationale: `Largest benchmark gap at ${topDrop.id} — shadow experiment candidate (not auto-started).`,
        suggestedNextAction: "Draft experiment spec in CRO tooling / AB layer when approved.",
        freshnessAt: t,
      },
    ];

    return {
      agentId: "cro",
      role: "conversion",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks: [],
      warnings: [],
    };
  } catch (e) {
    return emptyAgentOutput("cro", "conversion", { failureReason: e instanceof Error ? e.message : String(e) });
  }
}
