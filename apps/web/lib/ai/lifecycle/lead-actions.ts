import type { LeadTier } from "../lead-tier";

export type LeadLike = {
  status: string;
  score: number;
  aiTier?: string | null;
  lastFollowUpAt?: Date | null;
  createdAt?: Date;
};

/** Rule-based next actions (explainable; not ML). */
export function suggestNextLeadActions(lead: LeadLike): string[] {
  const actions: string[] = [];
  const tier = (lead.aiTier as LeadTier | undefined) ?? inferTierFromScore(lead.score);
  const status = lead.status.toLowerCase().replace(/\s+/g, "_");
  const daysSinceFollowUp = lead.lastFollowUpAt
    ? (Date.now() - lead.lastFollowUpAt.getTime()) / 86400000
    : 999;

  if (tier === "hot" && status === "new") {
    actions.push("Call within 2h — hot lead, confirm financing and book showing.");
  }
  if (tier === "warm" && ["new", "contacted"].includes(status)) {
    actions.push("Follow up within 48h — send 2 comparable listings + one market sentence.");
  }
  if (tier === "cold" && status === "new") {
    actions.push("Add to monthly nurture; no aggressive sales cadence.");
  }
  if (status === "visit_scheduled") {
    actions.push("Follow up for visit confirmation 24h before.");
  }
  if (status === "negotiation") {
    actions.push("Document next steps; AI does not negotiate — broker handles all offers.");
  }
  if (daysSinceFollowUp > 7 && !["closed", "lost"].includes(status)) {
    actions.push("No touch in 7+ days — send a short check-in (human-written).");
  }
  if (actions.length === 0) {
    actions.push("Review lead message and update CRM stage when appropriate.");
  }
  return [...new Set(actions)];
}

function inferTierFromScore(score: number): LeadTier {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}
