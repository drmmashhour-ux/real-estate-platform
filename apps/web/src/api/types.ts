/** Public API v1 — key/partner rows ship with dedicated migrations; shapes stay stable here. */
export type PlatformPartner = {
  id: string;
  name: string;
  active: boolean;
};

export type PlatformPublicApiKey = {
  id: string;
  keyHash: string;
  active: boolean;
  scopes: string[];
  billingPlan: string;
  usageCount: number;
  partner: PlatformPartner | null;
};

export type PublicApiKeyContext = {
  key: PlatformPublicApiKey;
};

export const PUBLIC_API_SCOPES = [
  "listings:read",
  "bookings:read",
  "leads:write",
  "analytics:read",
] as const;
export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];
