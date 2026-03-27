/** Standard tier labels for any 0–100 lead / behavior score (rule-based). */
export type LeadTier = "hot" | "warm" | "cold";

export function tierFromScore(score: number): LeadTier {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

export function tierEmoji(tier: LeadTier): string {
  switch (tier) {
    case "hot":
      return "🔥";
    case "warm":
      return "🌡️";
    default:
      return "❄️";
  }
}

/** Suggested broker actions (deterministic copy; not ML). */
export function recommendedActionsForLead(params: {
  tier: LeadTier;
  daysSinceCreated: number;
  lastFollowUpAt: Date | null;
}): string[] {
  const actions: string[] = [];
  if (params.tier === "hot") {
    actions.push("Contact within 24h");
    actions.push("Send similar listings in the same area / price band");
  } else if (params.tier === "warm") {
    actions.push("Follow up within 48h");
    actions.push("Share one comparable property + market note");
  } else {
    actions.push("Add to nurture sequence");
    actions.push("Re-engage after new inventory");
  }
  if (params.lastFollowUpAt == null && params.daysSinceCreated <= 2) {
    actions.push("Log first touch in CRM");
  }
  return [...new Set(actions)];
}
