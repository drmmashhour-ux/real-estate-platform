/**
 * Stripe operational readiness checklist (never exposes secret values).
 */

import {
  describeStripeSecretKeyError,
  describeStripeWebhookSecretError,
} from "@/lib/stripe/stripeEnvGate";

export type StripeConnectivityReadiness = {
  stripeSecretOk: boolean;
  stripeWebhookSecretOk: boolean;
  stripeSecretHint: string | null;
  stripeWebhookHint: string | null;
  stripeConnectDeclared: boolean;
};

export function isStripeConnectFeatureDeclared(): boolean {
  return process.env.STRIPE_CONNECT_ENABLED?.trim() === "true";
}

export function getStripeConnectivityReadiness(): StripeConnectivityReadiness {
  const skErr = describeStripeSecretKeyError();
  const whErr = describeStripeWebhookSecretError();
  return {
    stripeSecretOk: skErr === null,
    stripeWebhookSecretOk: whErr === null,
    stripeSecretHint: skErr,
    stripeWebhookHint: whErr,
    stripeConnectDeclared: isStripeConnectFeatureDeclared(),
  };
}
