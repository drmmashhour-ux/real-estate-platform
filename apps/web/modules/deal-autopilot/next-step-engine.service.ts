import type { NextBestAction } from "./deal-autopilot.types";

export function buildNextBestActions(input: {
  blockers: import("./deal-autopilot.types").AutopilotBlocker[];
  overdueItems: import("./deal-autopilot.types").OverdueItem[];
}): NextBestAction[] {
  const actions: NextBestAction[] = [];
  let rank = 1;

  for (const o of input.overdueItems.slice(0, 5)) {
    actions.push({
      id: `overdue_${o.id}`,
      title: `Address overdue: ${o.label}`,
      summary: o.dueAt ? `Was due ${o.dueAt}` : "No due date stored — set tracking in file.",
      whyItMatters: "Missed deadlines increase file risk and client friction.",
      urgency: "high",
      riskIfIgnored: "Possible failed condition or delayed closing.",
      suggestedAction: "Confirm status with parties and update condition/request records.",
      brokerApprovalRequired: false,
      rank: rank++,
    });
  }

  for (const b of input.blockers.slice(0, 6)) {
    actions.push({
      id: `blocker_${b.id}`,
      title: `Resolve: ${b.title}`,
      summary: b.detail,
      whyItMatters: "Unresolved blockers slow execution and may trigger compliance review.",
      urgency: b.severity === "high" ? "high" : "medium",
      riskIfIgnored: "File may stall or fail readiness checks.",
      suggestedAction: "Review in authorized OACIQ workflow and update deal documents/requests.",
      brokerApprovalRequired: true,
      rank: rank++,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "maintain_momentum",
      title: "Maintain file hygiene",
      summary: "No urgent blockers detected from tracked data — confirm milestones with client.",
      whyItMatters: "Proactive updates reduce last-minute surprises.",
      urgency: "low",
      riskIfIgnored: "Minor drift in client expectations.",
      suggestedAction: "Send a broker-approved status update (draft available via communication hook).",
      brokerApprovalRequired: true,
      rank: 1,
    });
  }

  return actions.sort((a, b) => a.rank - b.rank);
}
