/** Operator CRM prospect statuses — client-safe constants (keep separate from prisma-backed services). */

export const BROKER_PROSPECT_STATUSES = [
  "new",
  "contacted",
  "replied",
  "demo_scheduled",
  "converted",
  "lost",
] as const;

export type BrokerProspectStatus = (typeof BROKER_PROSPECT_STATUSES)[number];
