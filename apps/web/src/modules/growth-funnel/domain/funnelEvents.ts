/** Canonical funnel events for LECIPM growth analytics (PostHog + DB). */
export const FUNNEL_EVENTS = [
  "landing_visit",
  "signup_started",
  "first_action_completed",
  "simulator_used",
  "scenario_saved",
  "return_visit",
  "upgrade_clicked",
  "upgrade_started",
  "upgrade_completed",
  "referral_invite_sent",
  "referral_reward_earned",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export function isFunnelEventName(s: string): s is FunnelEventName {
  return (FUNNEL_EVENTS as readonly string[]).includes(s);
}
