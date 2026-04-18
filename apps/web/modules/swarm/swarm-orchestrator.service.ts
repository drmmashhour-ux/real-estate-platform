/**
 * Swarm orchestrator — fan-out agents, score, negotiate, bundle (advisory only).
 */
import { autonomousCompanyFlags, swarmSystemFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { runAdsAgent } from "./ads-agent.service";
import { runBrainAgent } from "./brain-agent.service";
import { runContentAgent } from "./content-agent.service";
import { runCroAgent } from "./cro-agent.service";
import { buildSwarmDecisionBundle } from "./swarm-decision-bundle.service";
import { applySwarmInfluence } from "./swarm-influence.service";
import { buildSwarmHealthSummary } from "./swarm-health.service";
import { detectSwarmConflicts, negotiateProposals } from "./swarm-negotiation.service";
import { computeSwarmAggregateScores } from "./swarm-scoring.service";
import type {
  SwarmAgentId,
  SwarmAgentInput,
  SwarmAgentOutput,
  SwarmAgentRole,
  SwarmDecisionBundle,
  SwarmInfluenceReport,
  SwarmSnapshot,
} from "./swarm-system.types";
import { runMarketIntelAgent } from "./market-intel-agent.service";
import { runOperatorAgent } from "./operator-agent.service";
import { runPlatformCoreAgent } from "./platform-core-agent.service";
import { runStrategyAgent } from "./strategy-agent.service";

const NS = "[swarm:v1]";

const AGENT_ROLE: Record<SwarmAgentId, SwarmAgentRole> = {
  ads: "performance",
  cro: "conversion",
  brain: "intelligence",
  operator: "execution",
  platform_core: "orchestration",
  strategy: "strategy",
  market_intel: "market",
  content: "content",
};

let swarmCyclesSession = 0;

export function resetSwarmSessionForTests(): void {
  swarmCyclesSession = 0;
}

async function buildSwarmAgentInput(
  environment: "development" | "staging" | "production",
): Promise<SwarmAgentInput> {
  const cycleId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  let autonomousCompanyResult = null;
  let fusionSurface = null;

  try {
    if (autonomousCompanyFlags.autonomousCompanyModeV1) {
      const { runAutonomousCompanyCycle } = await import("@/modules/autonomous-company/autonomous-company.service");
      autonomousCompanyResult = await runAutonomousCompanyCycle({ environment });
    }
  } catch {
    /* optional context */
  }

  try {
    const { buildFusionPrimarySurface } = await import("@/modules/fusion/fusion-system.primary-surface");
    fusionSurface = await buildFusionPrimarySurface();
  } catch {
    /* optional context */
  }

  return {
    cycleId,
    generatedAt,
    environment,
    autonomousCompanyResult,
    fusionSurface,
  };
}

/**
 * End-to-end swarm cycle — read-only proposals; no auto-execution.
 */
export async function runSwarmCycle(opts?: {
  environment?: "development" | "staging" | "production";
}): Promise<SwarmSnapshot | null> {
  if (!swarmSystemFlags.swarmSystemV1) {
    logInfo(NS, { event: "swarm_skipped", reason: "FEATURE_SWARM_SYSTEM_V1_off" });
    return null;
  }

  const env = opts?.environment ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const input = await buildSwarmAgentInput(env);

  const runners: Array<{ id: SwarmAgentId; run: (i: SwarmAgentInput) => Promise<SwarmAgentOutput> }> = [
    { id: "ads", run: runAdsAgent },
    { id: "cro", run: runCroAgent },
    { id: "brain", run: runBrainAgent },
    { id: "operator", run: runOperatorAgent },
    { id: "platform_core", run: runPlatformCoreAgent },
    { id: "strategy", run: runStrategyAgent },
    { id: "market_intel", run: runMarketIntelAgent },
    { id: "content", run: runContentAgent },
  ];

  const outputs: SwarmAgentOutput[] = [];
  for (const { id, run } of runners) {
    try {
      outputs.push(await run(input));
    } catch (e) {
      outputs.push({
        agentId: id,
        role: AGENT_ROLE[id],
        proposals: [],
        risks: [],
        warnings: [],
        failureReason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const proposals = outputs.flatMap((o) => o.proposals);
  const conflicts = detectSwarmConflicts(proposals);
  const negotiationResults = negotiateProposals(proposals, conflicts);
  const scores = computeSwarmAggregateScores(proposals);

  const agentsRun = runners.map((r) => r.id);
  const readinessSummary = `readiness=${scores.swarmReadiness.toFixed(2)} · execSuitability=${scores.executionSuitability.toFixed(2)}`;

  const bundle = buildSwarmDecisionBundle({
    proposals,
    conflicts,
    negotiationResults,
    scores,
    agentsRun,
    readinessSummary,
  });

  let influencedBundle: SwarmDecisionBundle | null = null;
  let influenceReport: SwarmInfluenceReport | null = null;
  if (swarmSystemFlags.swarmAgentInfluenceV1) {
    const inf = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: outputs,
      swarmScores: scores,
      swarmConflicts: conflicts,
      swarmNegotiationResults: negotiationResults,
      swarmDecisionBundle: bundle,
    });
    influencedBundle = inf.influencedBundle;
    influenceReport = inf.report;
  }

  const health = buildSwarmHealthSummary(outputs, bundle);
  swarmCyclesSession += 1;

  if (swarmSystemFlags.swarmAgentPersistenceV1) {
    logInfo("[swarm:v1:persistence]", {
      event: "persistence_stub",
      note: "No Prisma model in this revision — consumers should persist bundle externally if needed.",
      cycleId: input.cycleId,
    });
  }

  logInfo(NS, {
    event: "swarm_cycle_complete",
    cycleId: input.cycleId,
    cyclesSession: swarmCyclesSession,
    proposals: proposals.length,
    conflicts: conflicts.length,
    negotiation: swarmSystemFlags.swarmAgentNegotiationV1,
    primary: swarmSystemFlags.swarmAgentPrimaryV1,
    agentsFailed: Object.keys(health.perAgentFailureCount).length,
  });

  logInfo("[swarm:v1:negotiation]", {
    event: "outcomes_summary",
    byStatus: health.negotiationOutcomeCounts,
    humanReview: bundle.groupedBy.human_review.length,
  });

  return {
    cycleId: input.cycleId,
    generatedAt: input.generatedAt,
    bundle,
    influencedBundle,
    influenceReport,
    health,
  };
}
