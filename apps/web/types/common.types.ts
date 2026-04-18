export type { Pagination, TenantId, UserId } from "./common";

/** Product / API domain labels for docs and routing — additive, not exhaustive. */
export const LecipmDomains = [
  "brokerage",
  "bnhub",
  "pricing",
  "monetization",
  "growth",
  "trust",
  "compliance",
  "documents",
  "deals",
  "crm",
  "messaging",
  "notifications",
  "mobile",
  "founder",
  "investor",
  "analytics",
  "admin",
] as const;

export type LecipmDomain = (typeof LecipmDomains)[number];
