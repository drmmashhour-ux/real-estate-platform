/**
 * Operator agent — execution-ready plan hints; read-only recommendations.
 */
import { operatorV2Flags } from "@/config/feature-flags";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { bounded01, emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runOperatorAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("operator", "execution");
  }
  try {
    const { listRecommendations } = await import("@/modules/operator/operator.repository");
    const recs = await listRecommendations(30);
    const t = input.generatedAt;
    if (recs.length === 0) {
      return {
        agentId: "operator",
        role: "execution",
        proposals: [],
        risks: [],
        warnings: ["No assistant recommendations available this cycle."],
      };
    }

    const top = recs[0]!;
    const batchCap = operatorV2Flags.operatorV2ExecutionPlanV1 ? 8 : 5;
    const proposals: SwarmProposal[] = [
      {
        id: proposalId("operator", "exec_ready"),
        agentId: "operator",
        role: "execution",
        sourceSystems: ["operator_v2"],
        targetEntity: { type: top.actionType, id: top.targetId },
        recommendationType: "execute",
        confidence: bounded01(top.confidenceScore),
        priority: bounded01(top.confidenceScore * 0.9 + (top.evidenceScore ?? 0.5) * 0.1),
        risk: bounded01(1 - top.confidenceScore),
        evidenceQuality: bounded01(top.evidenceScore ?? top.confidenceScore),
        blockers: [],
        dependencies: ["guardrails", "execution_plan_cap"],
        rationale: `Top scored recommendation ${top.id} — execution suitability depends on Platform Core and approvals.`,
        suggestedNextAction: `Review capped batch (≤${batchCap}) via Operator execution plan — no auto-run from swarm.`,
        freshnessAt: t,
      },
    ];

    return {
      agentId: "operator",
      role: "execution",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks: [],
      warnings: [],
    };
  } catch (e) {
    return emptyAgentOutput("operator", "execution", { failureReason: e instanceof Error ? e.message : String(e) });
  }
}
