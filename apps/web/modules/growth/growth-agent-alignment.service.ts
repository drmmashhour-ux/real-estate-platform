/**
 * Deterministic alignment themes across agent proposals.
 */

import type { GrowthAgentAlignment, GrowthAgentProposal } from "./growth-agents.types";

function textOf(p: GrowthAgentProposal): string {
  return `${p.title} ${p.description} ${p.rationale}`.toLowerCase();
}

export function detectGrowthAgentAlignments(proposals: GrowthAgentProposal[]): GrowthAgentAlignment[] {
  const out: GrowthAgentAlignment[] = [];
  let seq = 0;

  const followUp = proposals.filter(
    (p) =>
      (p.agentId === "leads_agent" || p.agentId === "messaging_agent") &&
      (textOf(p).includes("follow") || textOf(p).includes("due") || textOf(p).includes("hot")),
  );
  if (followUp.length >= 2) {
    seq += 1;
    out.push({
      id: `align-follow-${seq}`,
      proposalIds: followUp.slice(0, 4).map((p) => p.id),
      theme: "High-intent follow-up focus",
      confidence: 0.72,
    });
  }

  const campaign = proposals.filter(
    (p) =>
      (p.agentId === "ads_agent" || p.agentId === "content_agent") &&
      (textOf(p).includes("campaign") || textOf(p).includes("utm") || textOf(p).includes("align")),
  );
  if (campaign.length >= 2) {
    seq += 1;
    out.push({
      id: `align-campaign-${seq}`,
      proposalIds: campaign.slice(0, 4).map((p) => p.id),
      theme: "Campaign + content alignment",
      confidence: 0.62,
    });
  }

  const caution = proposals.filter(
    (p) =>
      (p.agentId === "governance_agent" || p.agentId === "fusion_agent") &&
      (textOf(p).includes("risk") || textOf(p).includes("caution") || textOf(p).includes("review") || p.impact === "high"),
  );
  if (caution.length >= 2) {
    seq += 1;
    out.push({
      id: `align-caution-${seq}`,
      proposalIds: caution.slice(0, 4).map((p) => p.id),
      theme: "Governance / fusion caution alignment",
      confidence: 0.68,
    });
  }

  return out.slice(0, 8);
}
