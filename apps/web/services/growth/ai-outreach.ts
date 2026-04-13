/**
 * Light “AI-style” outreach helpers: templates, personalization tokens, follow-up scheduling.
 * No external LLM — deterministic, fast, safe for production. See `docs/first-1000-users.md`.
 */

export type OutreachPersona = "host" | "guest";

export const OUTREACH_TEMPLATES: Record<OutreachPersona | "followup" | "close", string> = {
  host: `Hi{{NAME}}! We're launching BNHUB in {{AREA}} and promoting a small group of early hosts.

We bring extra visibility, lower fees, and active marketing.

Would you like to get early bookings and be featured?`,
  guest: `Hey{{NAME}}! We're launching a new platform with better prices and verified listings in {{AREA}}.

We're giving early users priority deals and support.

Want to try it?`,
  followup: `Quick follow-up{{NAME}} — we're actively onboarding hosts and guests this week. Still interested?`,
  close: `Great — I'll get you set up now. Under 5 minutes. Here's the link: {{LINK}}`,
};

export type PersonalizeVars = {
  name?: string | null;
  area?: string | null;
  link?: string | null;
};

export function personalizeMessage(template: string, vars: PersonalizeVars): string {
  const name = vars.name?.trim();
  const area = (vars.area?.trim() || "your area").slice(0, 80);
  const link = vars.link?.trim() || "{{your_signup_link}}";
  return template
    .replace(/\{\{NAME\}\}/g, name ? ` ${name}` : "")
    .replace(/\{\{AREA\}\}/g, area)
    .replace(/\{\{LINK\}\}/g, link);
}

export function buildOutreachMessage(
  persona: OutreachPersona,
  vars: PersonalizeVars
): string {
  return personalizeMessage(OUTREACH_TEMPLATES[persona], vars);
}

/** Suggested follow-up datetime (hours from first contact). */
export function suggestFollowUpAt(from: Date, hoursLater: number): Date {
  return new Date(from.getTime() + hoursLater * 60 * 60 * 1000);
}

/** Default follow-up window for semi-automated sequences (24–48h). */
export const DEFAULT_FOLLOWUP_HOURS_MIN = 24;
export const DEFAULT_FOLLOWUP_HOURS_MAX = 48;

export function pickFollowUpHours(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 1000;
  const span = DEFAULT_FOLLOWUP_HOURS_MAX - DEFAULT_FOLLOWUP_HOURS_MIN;
  return DEFAULT_FOLLOWUP_HOURS_MIN + (h % (span + 1));
}
