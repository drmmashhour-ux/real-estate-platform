export type IdentityProviderId = "stripe_identity" | "manual" | "other";

export type IdentityVerificationSessionResult =
  | { sessionId: string; clientSecret?: string | null; url?: string | null }
  | { error: string };

export type IdentityVerificationStatusResult = {
  status: "not_started" | "pending" | "requires_input" | "verified" | "failed" | "restricted";
  documentType?: string | null;
  countryCode?: string | null;
  safeSummary: string;
  raw?: unknown;
};

export interface IdentityProviderAdapter {
  readonly providerId: IdentityProviderId;
  createVerificationSession(params: {
    userId: string;
    returnUrl: string;
    metadata?: Record<string, string>;
  }): Promise<IdentityVerificationSessionResult>;
  getVerificationStatus(sessionId: string): Promise<IdentityVerificationStatusResult | { error: string }>;
  mapWebhookPayload(payload: unknown): Partial<IdentityVerificationStatusResult> & { sessionId?: string };
  getSafeSummary(status: IdentityVerificationStatusResult["status"]): string;
}
