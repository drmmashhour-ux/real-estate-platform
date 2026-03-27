/**
 * Stripe Identity — server-side only.
 */

import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { IdentityProviderAdapter, IdentityVerificationStatusResult } from "./identityProviderTypes";

function mapStripeStatus(
  s: Stripe.Identity.VerificationSession.Status
): IdentityVerificationStatusResult["status"] {
  switch (s) {
    case "canceled":
      return "failed";
    case "processing":
    case "requires_input":
      return s === "requires_input" ? "requires_input" : "pending";
    case "verified":
      return "verified";
    default:
      return "pending";
  }
}

export class StripeIdentityAdapter implements IdentityProviderAdapter {
  readonly providerId = "stripe_identity" as const;

  getSafeSummary(status: IdentityVerificationStatusResult["status"]): string {
    switch (status) {
      case "verified":
        return "Identity verification completed.";
      case "failed":
        return "Verification could not be completed. You can try again.";
      case "restricted":
        return "Additional review is required for your account.";
      case "requires_input":
        return "Additional information is needed to continue verification.";
      case "pending":
        return "Verification is in progress.";
      default:
        return "Verification not started.";
    }
  }

  async createVerificationSession(params: {
    userId: string;
    returnUrl: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = getStripe();
    if (!stripe) return { error: "Stripe is not configured" };
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: { userId: params.userId, ...params.metadata },
        return_url: params.returnUrl,
      });
      return {
        sessionId: session.id,
        clientSecret: session.client_secret,
        url: session.url,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Stripe Identity error" };
    }
  }

  async getVerificationStatus(sessionId: string) {
    const stripe = getStripe();
    if (!stripe) return { error: "Stripe is not configured" };
    try {
      const s = await stripe.identity.verificationSessions.retrieve(sessionId);
      const status = mapStripeStatus(s.status);
      const lastError = s.last_error?.reason ?? null;
      return {
        status,
        documentType: s.type === "document" ? "document" : null,
        countryCode: null,
        safeSummary: lastError
          ? `${this.getSafeSummary(status)} (${lastError})`
          : this.getSafeSummary(status),
        raw: s,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Retrieve failed" };
    }
  }

  mapWebhookPayload(payload: unknown): Partial<IdentityVerificationStatusResult> & { sessionId?: string } {
    const obj = payload as Stripe.Identity.VerificationSession;
    if (!obj?.id) return {};
    return {
      sessionId: obj.id,
      status: obj.status ? mapStripeStatus(obj.status) : undefined,
      safeSummary: obj.status ? this.getSafeSummary(mapStripeStatus(obj.status)) : undefined,
      raw: obj,
    };
  }
}
