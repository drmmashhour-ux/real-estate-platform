import type { LeadFunnelRow } from "./funnel.types";
import { mapPipelineStatusToFunnelStage } from "./funnel.service";

/**
 * Human-executable next steps only — no automated sends.
 */
export function buildFollowUpActions(lead: LeadFunnelRow): string[] {
  const stage = mapPipelineStatusToFunnelStage(lead.pipelineStatus);
  const actions: string[] = [];

  if (stage === "lost") {
    actions.push("Record lost reason for reporting");
    actions.push("Optional: human re-engagement after cooling-off (no automation)");
    return [...new Set(actions)];
  }

  if (stage === "new" || stage === "excluded") {
    actions.push("Call lead within 5 minutes");
    actions.push("Review lead score and source before outreach");
  }
  if (stage === "contacted") {
    actions.push("Send follow-up message");
    actions.push("Confirm budget and timeline on the next touch");
  }
  if (stage === "qualified") {
    actions.push("Schedule showing");
    actions.push("Send listing shortlist aligned to stated criteria");
  }
  if (stage === "showing") {
    actions.push("Schedule showing");
    actions.push("Log feedback and next steps after the visit");
  }
  if (stage === "offer") {
    actions.push("Align offer strategy with seller expectations");
    actions.push("Track contingencies and financing milestones");
  }
  if (stage === "closed") {
    actions.push("Request testimonial and referral when appropriate");
  }

  if (lead.score != null && lead.score >= 70) {
    actions.unshift("Prioritize this lead — score indicates strong intent");
  }

  return [...new Set(actions)];
}
