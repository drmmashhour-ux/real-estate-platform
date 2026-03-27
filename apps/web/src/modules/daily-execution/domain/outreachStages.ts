export const OUTREACH_COACHING_STAGES = ["contacted", "replied", "follow_up_sent", "demo_booked"] as const;

export type OutreachCoachingStage = (typeof OUTREACH_COACHING_STAGES)[number];

export function isOutreachCoachingStage(v: string): v is OutreachCoachingStage {
  return (OUTREACH_COACHING_STAGES as readonly string[]).includes(v);
}
