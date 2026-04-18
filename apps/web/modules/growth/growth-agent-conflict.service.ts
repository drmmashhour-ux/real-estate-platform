/**
 * Deterministic conflict detection between agent proposals (advisory).
 */

import type { GrowthAgentConflict, GrowthAgentProposal } from "./growth-agents.types";

function textOf(p: GrowthAgentProposal): string {
  return `${p.title} ${p.description} ${p.rationale}`.toLowerCase();
}

/**
 * Detects pairwise theme conflicts — conservative severity.
 */
export function detectGrowthAgentConflicts(proposals: GrowthAgentProposal[]): GrowthAgentConflict[] {
  const out: GrowthAgentConflict[] = [];
  let seq = 0;

  const scaleAds = proposals.filter(
    (p) =>
      p.agentId === "ads_agent" &&
      (textOf(p).includes("scale") || textOf(p).includes("consider scaling") || textOf(p).includes("opportunity")),
  );
  const fixCro = proposals.filter(
    (p) =>
      (p.agentId === "cro_agent" && (textOf(p).includes("conversion") || textOf(p).includes("funnel"))) ||
      textOf(p).includes("strengthen capture") ||
      textOf(p).includes("cro"),
  );
  if (scaleAds.length && fixCro.length) {
    seq += 1;
    out.push({
      id: `conf-scale-vs-cro-${seq}`,
      proposalIds: [scaleAds[0]!.id, fixCro[0]!.id],
      reason: "Acquisition scale suggestion may conflict with conversion-hardening emphasis.",
      severity: "medium",
    });
  }

  const govFreeze = proposals.filter(
    (p) =>
      p.agentId === "governance_agent" &&
      (textOf(p).includes("freeze") || textOf(p).includes("human review") || textOf(p).includes("risk")),
  );
  if (scaleAds.length && govFreeze.length) {
    seq += 1;
    out.push({
      id: `conf-ads-vs-gov-${seq}`,
      proposalIds: [scaleAds[0]!.id, govFreeze[0]!.id],
      reason: "Governance caution while ads agent suggests growth emphasis — align in review.",
      severity: "high",
    });
  }

  const msgUrgent = proposals.filter((p) => p.agentId === "messaging_agent" && textOf(p).includes("due"));
  const govHr = govFreeze.find((g) => textOf(g).includes("human review"));
  if (msgUrgent.length && govHr) {
    seq += 1;
    out.push({
      id: `conf-msg-vs-gov-${seq}`,
      proposalIds: [msgUrgent[0]!.id, govHr.id],
      reason: "Immediate messaging work may overlap governance human-review requirement.",
      severity: "medium",
    });
  }

  const contentMore = proposals.filter((p) => p.agentId === "content_agent" && textOf(p).includes("draft"));
  const leadsBacklog = proposals.filter((p) => p.agentId === "leads_agent" && textOf(p).includes("due"));
  if (contentMore.length && leadsBacklog.length && ctxHeavyBacklog(leadsBacklog[0]!)) {
    seq += 1;
    out.push({
      id: `conf-content-vs-leads-${seq}`,
      proposalIds: [contentMore[0]!.id, leadsBacklog[0]!.id],
      reason: "Content drafting may compete with follow-up backlog focus — sequence manually.",
      severity: "low",
    });
  }

  const fusionHi = proposals.filter((p) => p.agentId === "fusion_agent" && (p.impact === "high" || (p.priorityScore ?? 0) >= 80));
  if (fusionHi.length && govFreeze.length) {
    seq += 1;
    out.push({
      id: `conf-fusion-vs-gov-${seq}`,
      proposalIds: [fusionHi[0]!.id, govFreeze[0]!.id],
      reason: "Strong fusion priority may disagree with governance freeze/review posture.",
      severity: "high",
    });
  }

  return out.slice(0, 12);
}

function ctxHeavyBacklog(p: GrowthAgentProposal): boolean {
  const t = textOf(p);
  return t.includes("due") && (t.includes("follow-up") || t.includes("queue")) || (p.priorityScore ?? 0) >= 70;
}
