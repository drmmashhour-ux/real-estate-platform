/**
 * Market intelligence agent — demand/performance shifts (stub + autonomous market hints).
 */
import { buildMarketIntelligenceSummary } from "@/modules/autonomous-company/market-intelligence.service";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runMarketIntelAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("market_intel", "market");
  }
  try {
    const summary = await buildMarketIntelligenceSummary();
    const t = input.generatedAt;
    const proposals: SwarmProposal[] = [
      {
        id: proposalId("market", "signals"),
        agentId: "market_intel",
        role: "market",
        sourceSystems: ["market_intel_stub"],
        recommendationType: summary.warnings.length ? "caution" : "monitor",
        confidence: 0.45,
        priority: 0.48,
        risk: 0.42,
        evidenceQuality: 0.4,
        blockers: [],
        dependencies: ["tenant_scoped_analytics"],
        rationale: summary.trends[0] ?? "Market signals pending richer marketplace-intelligence wiring.",
        suggestedNextAction: "Connect marketplace-intelligence orchestrator when data policy allows.",
        freshnessAt: t,
      },
    ];

    return {
      agentId: "market_intel",
      role: "market",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks: [],
      warnings: summary.warnings,
    };
  } catch (e) {
    return emptyAgentOutput("market_intel", "market", { failureReason: e instanceof Error ? e.message : String(e) });
  }
}
