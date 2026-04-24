/**
 * LECIPM console / broker CRM lead APIs — canonical paths under `/api/lecipm/leads`.
 *
 * Legacy `/api/leads` is rewritten to these routes in `next.config.ts` (do not add new call sites to `/api/leads`).
 */

export const LECIPM_LEADS_API = "/api/lecipm/leads" as const;

export const LECIPM_LEADS_SUMMARY = `${LECIPM_LEADS_API}/summary` as const;
export const LECIPM_LEADS_ASSISTANT_STATS = `${LECIPM_LEADS_API}/assistant-stats` as const;
export const LECIPM_LEADS_CHECKOUT = `${LECIPM_LEADS_API}/checkout` as const;
export const LECIPM_LEADS_UNLOCK = `${LECIPM_LEADS_API}/unlock` as const;
export const LECIPM_LEADS_CENTRIS_CAPTURE = `${LECIPM_LEADS_API}/centris/capture` as const;
export const LECIPM_LEADS_HUB_CAPTURE = `${LECIPM_LEADS_API}/hub-capture` as const;
export const LECIPM_LEADS_CREATE = `${LECIPM_LEADS_API}/create` as const;

export function lecipmLeadById(leadId: string): string {
  return `${LECIPM_LEADS_API}/${encodeURIComponent(leadId)}`;
}

export function lecipmLeadUnlockCheckout(leadId: string): string {
  return `${LECIPM_LEADS_API}/${encodeURIComponent(leadId)}/unlock-checkout`;
}

export function lecipmLeadPlaybook(leadId: string): string {
  return `${LECIPM_LEADS_API}/${encodeURIComponent(leadId)}/playbook`;
}

export function lecipmLeadTimeline(leadId: string): string {
  return `${LECIPM_LEADS_API}/${encodeURIComponent(leadId)}/timeline`;
}
