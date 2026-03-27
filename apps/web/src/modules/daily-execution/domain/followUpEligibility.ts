/**
 * Pure helper: eligible for “nudge” list when last touch was at or before `cutoff` (e.g. now - 24h).
 */
export function isLeadDueForFollowUp(input: {
  lastContactedAt: Date | null;
  outreachCoachingStage: string | null;
  pipelineStatus: string;
  cutoff: Date;
}): boolean {
  const { lastContactedAt, outreachCoachingStage, pipelineStatus, cutoff } = input;
  if (!lastContactedAt || lastContactedAt > cutoff) return false;
  if (pipelineStatus === "won" || pipelineStatus === "lost") return false;
  if (outreachCoachingStage === "replied" || outreachCoachingStage === "demo_booked") return false;
  if (outreachCoachingStage == null || outreachCoachingStage === "contacted" || outreachCoachingStage === "follow_up_sent") {
    return true;
  }
  return false;
}
