/**
 * Strategy agent — higher-level priorities from Autonomous Company + Fusion context (read-only).
 */
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { bounded01, emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runStrategyAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("strategy", "strategy");
  }
  const t = input.generatedAt;
  const ac = input.autonomousCompanyResult;
  const fusion = input.fusionSurface?.snapshot;

  if (!ac && !fusion) {
    return {
      agentId: "strategy",
      role: "strategy",
      proposals: [],
      risks: [],
      warnings: ["No autonomous company or Fusion snapshot in context — strategy proposals minimal."],
    };
  }

  const proposals: SwarmProposal[] = [];
  if (ac?.strategy?.priorities[0]) {
    const p = ac.strategy.priorities[0]!;
    proposals.push({
      id: proposalId("strategy", "priority_1"),
      agentId: "strategy",
      role: "strategy",
      sourceSystems: ["autonomous_company", "fusion_optional"],
      recommendationType: "other",
      confidence: 0.58,
      priority: 0.72,
      risk: 0.4,
      evidenceQuality: 0.5,
      blockers: [],
      dependencies: [],
      rationale: `Strategic priority: ${p.label}`,
      suggestedNextAction: "Align Operator and CRO experiments with this priority in review sessions.",
      freshnessAt: t,
    });
  }

  if (fusion?.scores?.agreementScore !== undefined) {
    proposals.push({
      id: proposalId("strategy", "fusion_agreement"),
      agentId: "strategy",
      role: "strategy",
      sourceSystems: ["fusion"],
      recommendationType: fusion.scores.agreementScore < 0.45 ? "caution" : "monitor",
      confidence: bounded01(fusion.scores.fusedConfidence),
      priority: 0.55,
      risk: bounded01(fusion.scores.fusedRisk),
      evidenceQuality: bounded01(fusion.scores.evidenceQuality),
      blockers: [],
      dependencies: [],
      rationale: `Fusion agreement ${fusion.scores.agreementScore.toFixed(2)} — informs cross-domain sequencing.`,
      suggestedNextAction: "Use Fusion snapshot as advisory cross-check; not a substitute for domain owners.",
      freshnessAt: t,
    });
  }

  return {
    agentId: "strategy",
    role: "strategy",
    proposals: mapProposalsWithFreshness(proposals, t),
    risks: [],
    warnings: [],
  };
}
