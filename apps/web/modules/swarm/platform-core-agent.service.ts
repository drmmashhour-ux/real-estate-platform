/**
 * Platform Core agent — dependency / blocked / scheduler context (read-only decisions list).
 */
import { platformCoreFlags } from "@/config/feature-flags";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runPlatformCoreAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("platform_core", "orchestration");
  }
  if (!platformCoreFlags.platformCoreV1) {
    return {
      agentId: "platform_core",
      role: "orchestration",
      proposals: [],
      risks: [],
      warnings: ["Platform Core V1 off — decisions not loaded."],
    };
  }
  try {
    const { listDecisions } = await import("@/modules/platform-core/platform-core.repository");
    const decisions = await listDecisions({ limit: 20 });
    const t = input.generatedAt;
    const blocked = decisions.filter((d) => d.status === "BLOCKED");
    const proposals: SwarmProposal[] = [];

    if (blocked.length > 0) {
      const b = blocked[0]!;
      proposals.push({
        id: proposalId("pc", "blocked_signal"),
        agentId: "platform_core",
        role: "orchestration",
        sourceSystems: ["platform_core_v2"],
        targetEntity: { type: "decision", id: b.id },
        recommendationType: "block",
        confidence: 0.62,
        priority: 0.7,
        risk: 0.35,
        evidenceQuality: 0.5,
        blockers: ["dependency_or_policy"],
        dependencies: [],
        rationale: "Recent decisions include blocked states — downstream execution must respect dependencies.",
        suggestedNextAction: "Review dependency graph and scheduler readiness before Operator execution.",
        freshnessAt: t,
      });
    } else {
      proposals.push({
        id: proposalId("pc", "scheduler_ok"),
        agentId: "platform_core",
        role: "orchestration",
        sourceSystems: ["platform_core_v2"],
        recommendationType: "monitor",
        confidence: 0.54,
        priority: 0.44,
        risk: 0.38,
        evidenceQuality: 0.52,
        blockers: [],
        dependencies: [],
        rationale: "No blocked decisions in recent sample — scheduler context appears permissive for planning.",
        suggestedNextAction: "Continue monitoring Platform Core queue health.",
        freshnessAt: t,
      });
    }

    return {
      agentId: "platform_core",
      role: "orchestration",
      proposals: mapProposalsWithFreshness(proposals, t),
      risks: [],
      warnings: [],
    };
  } catch (e) {
    return emptyAgentOutput("platform_core", "orchestration", {
      failureReason: e instanceof Error ? e.message : String(e),
    });
  }
}
