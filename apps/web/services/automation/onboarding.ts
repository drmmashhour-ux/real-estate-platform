/**
 * Enterprise onboarding automation — structured guidance; no silent account changes.
 * Pair with product UI and email templates; audit when adding webhooks.
 */

import { HOST_ONBOARDING_FLOW, suggestNightlyPriceCents } from "@/lib/growth/host-onboarding-playbook";
import { GUEST_ONBOARDING_TIPS } from "@/services/growth/retention";

export function getHostOnboardingChecklist() {
  return HOST_ONBOARDING_FLOW.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    route: s.route ?? null,
    auto: Boolean(s.auto),
  }));
}

export function getGuestOnboardingTips() {
  return [...GUEST_ONBOARDING_TIPS];
}

export function getPricingAssistance(medianPeerNightlyCents: number, tier: "economy" | "standard" | "premium") {
  return {
    suggestedNightlyCents: suggestNightlyPriceCents(medianPeerNightlyCents, tier),
    note: "Host must confirm; log overrides for analytics.",
  };
}

/** Follow-up reminder copy for stalled host leads (CRM manual send). */
export function hostFollowUpReminder(hostName?: string) {
  const n = hostName?.trim();
  return `Hi${n ? ` ${n}` : ""} — quick nudge to finish your listing draft. Early hosts in your area still get extra visibility this month.`;
}
