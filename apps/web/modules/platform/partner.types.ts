/**
 * Partner record for public API access and webhooks.
 * Production should persist partners and store only hashed API secrets.
 */

export type PartnerType = "broker" | "agency" | "technology" | "integration" | "other";

export type Partner = {
  id: string;
  name: string;
  type: PartnerType;
  /** Raw key for validation in this reference implementation — replace with secret hash + lookup. */
  apiKey: string;
  /** OAuth-style scopes for public routes. */
  scopes: string[];
  /** Optional webhook target for platform events. */
  webhookUrl?: string;
};

export const PUBLIC_API_SCOPES = [
  "leads:read",
  "leads:write",
  "deals:read",
  "deals:write",
  "insights:read",
  "messaging:read",
  "bookings:write",
] as const;

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];
