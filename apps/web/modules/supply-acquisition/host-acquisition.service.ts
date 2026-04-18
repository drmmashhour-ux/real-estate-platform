/**
 * Host acquisition: drafts only — operators send through compliant channels after review (Law 25 / CASL-style consent).
 */

import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

export type HostOutreachDraft = {
  channel: "email" | "linkedin_dm" | "internal_note";
  subject?: string;
  body: string;
  personalizationTokens: Record<string, string>;
  reviewRequired: true;
};

export function buildHostOutreachDraft(target: MontrealOpportunityRow): HostOutreachDraft {
  const tokens = {
    neighborhood: target.neighborhood,
    propertyFocus: target.propertyType ?? "mixed inventory",
    priceBand: target.priceBand,
  };
  return {
    channel: "email",
    subject: `BNHUB host partnership — ${target.neighborhood} (${target.priceBand})`,
    body: [
      "Hello —",
      "",
      `We’re expanding curated short-term stays in ${target.neighborhood}, with a current focus on ${tokens.propertyFocus} stays in the ${target.priceBand} band.`,
      "LECIPM/BNHUB uses Stripe for guest payments and transparent host tools (calendar, pricing suggestions you approve, trust review when applicable).",
      "If listing with us fits your plans, reply and we’ll schedule a short walkthrough — no automated messaging after this without your consent.",
      "",
      "— LECIPM growth (draft; edit before send)",
    ].join("\n"),
    personalizationTokens: tokens,
    reviewRequired: true,
  };
}
