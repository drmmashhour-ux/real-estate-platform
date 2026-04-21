/**
 * Automated outreach limits (cold / follow-up). Callers must still obtain user consent where required
 * (Québec Law 25 / messaging preferences) before sending platform messages.
 */

export type OutreachKind = "new_lead" | "no_reply_24h" | "property_viewed";

const COOLDOWN_MS: Record<OutreachKind, number> = {
  /** One welcome-style automation per thread / lead window */
  new_lead: 6 * 60 * 60 * 1000,
  /** Max one nudge per 48h */
  no_reply_24h: 48 * 60 * 60 * 1000,
  /** Property view follow-up: at most once per 7 days per listing+viewer pair (enforced higher up) */
  property_viewed: 7 * 24 * 60 * 60 * 1000,
};

const DAILY_CAP_PER_USER = 12;

export function outreachCooldownMs(kind: OutreachKind): number {
  return COOLDOWN_MS[kind];
}

export function isUnderDailyCap(sendsTodayForUser: number): boolean {
  return sendsTodayForUser < DAILY_CAP_PER_USER;
}
