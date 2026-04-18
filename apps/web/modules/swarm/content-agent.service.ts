/**
 * Content agent — draft-only suggestions (no auto-publish).
 */
import { buildContentGrowthDrafts } from "@/modules/autonomous-company/content-growth.service";
import type { SwarmAgentInput, SwarmAgentOutput, SwarmProposal } from "./swarm-system.types";
import { emptyAgentOutput, isSwarmAgentLayerEnabled, mapProposalsWithFreshness, proposalId } from "./swarm-agent-utils";

export async function runContentAgent(input: SwarmAgentInput): Promise<SwarmAgentOutput> {
  if (!isSwarmAgentLayerEnabled()) {
    return emptyAgentOutput("content", "content");
  }
  const t = input.generatedAt;
  const drafts = buildContentGrowthDrafts(input.autonomousCompanyResult?.strategy ?? null);
  const proposals: SwarmProposal[] = [];

  for (const ad of drafts.adCopyVariants.slice(0, 2)) {
    proposals.push({
      id: proposalId("content", ad.id),
      agentId: "content",
      role: "content",
      sourceSystems: ["content_growth"],
      recommendationType: "content_draft",
      confidence: 0.42,
      priority: 0.4,
      risk: 0.25,
      evidenceQuality: 0.38,
      blockers: drafts.publishAllowed ? [] : ["publish_disabled"],
      dependencies: ["legal_review"],
      rationale: ad.draft.slice(0, 200),
      suggestedNextAction: "Manual review in marketing studio — drafts are not auto-published.",
      freshnessAt: t,
    });
  }

  if (proposals.length === 0) {
    proposals.push({
      id: proposalId("content", "noop"),
      agentId: "content",
      role: "content",
      sourceSystems: ["content_growth"],
      recommendationType: "monitor",
      confidence: 0.4,
      priority: 0.35,
      risk: 0.2,
      evidenceQuality: 0.35,
      blockers: [],
      dependencies: [],
      rationale: "No draft lines emitted — enable FEATURE_AUTONOMOUS_CONTENT_V1 for richer draft suggestions upstream.",
      suggestedNextAction: "Review content policy before enabling draft expansion.",
      freshnessAt: t,
    });
  }

  return {
    agentId: "content",
    role: "content",
    proposals: mapProposalsWithFreshness(proposals, t),
    risks: [],
    warnings: drafts.notes,
  };
}
