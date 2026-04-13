/**
 * Single source of truth for BNHUB host payout + platform Stripe Connect readiness
 * before creating a Checkout Session with transfer_data.destination.
 */

import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logWarn } from "@/lib/logger";

/** User-facing copy — do not expose raw Stripe errors. */
export const BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE =
  "Host payout is not configured yet. Booking checkout is temporarily unavailable.";

/** Single stable HTTP JSON `code` for any BNHUB payout/Connect block (see `detailCode` for diagnostics). */
export const BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE = "HOST_PAYOUT_NOT_READY" as const;

export type HostStripePayoutBlockedCode =
  | "STRIPE_NOT_CONFIGURED"
  | "STRIPE_CONNECT_PLATFORM_UNAVAILABLE"
  | "HOST_PAYOUT_NOT_CONFIGURED"
  | "HOST_ONBOARDING_INCOMPLETE"
  | "HOST_PAYOUT_NOT_READY";

export type HostStripePayoutReadinessResult =
  | { ok: true; code: "READY"; userMessage: ""; logDetail: "" }
  | {
      ok: false;
      code: HostStripePayoutBlockedCode;
      userMessage: string;
      logDetail: string;
    };

type ProbeCache =
  | { kind: "ready"; at: number }
  | { kind: "connect_disabled"; at: number }
  | { kind: "transient"; at: number; message: string };

let connectProbeCache: ProbeCache | null = null;

const CACHE_READY_MS = 6 * 60 * 60 * 1000;
const CACHE_DISABLED_MS = 15 * 60 * 1000;
const CACHE_TRANSIENT_MS = 60 * 1000;

function cacheFresh(cache: ProbeCache, ttl: number): boolean {
  return Date.now() - cache.at < ttl;
}

/**
 * Probes whether the platform Stripe account can create Connect Express accounts.
 * Caches success/disabled to avoid repeated API calls; transient errors use a short TTL.
 */
export async function probeStripeConnectPlatformEnabled(): Promise<{ ok: boolean; logDetail: string }> {
  const now = Date.now();
  if (connectProbeCache) {
    if (connectProbeCache.kind === "ready" && cacheFresh(connectProbeCache, CACHE_READY_MS)) {
      return { ok: true, logDetail: "cached: connect_ready" };
    }
    if (connectProbeCache.kind === "connect_disabled" && cacheFresh(connectProbeCache, CACHE_DISABLED_MS)) {
      return { ok: false, logDetail: "cached: connect_not_enabled" };
    }
    if (connectProbeCache.kind === "transient" && cacheFresh(connectProbeCache, CACHE_TRANSIENT_MS)) {
      return { ok: false, logDetail: `cached: ${connectProbeCache.message}` };
    }
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, logDetail: "stripe_client_unavailable" };
  }

  const PROBE_MS = 12_000;
  try {
    const acct = await Promise.race([
      stripe.accounts.create({
        type: "express",
        country: "CA",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
        metadata: { lecipm_connect_probe: "1" },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("connect_probe_timeout")), PROBE_MS);
      }),
    ]);
    await stripe.accounts.del(acct.id).catch(() => {
      logWarn("[stripe] Connect probe account delete failed (non-fatal)", { accountId: acct.id });
    });
    connectProbeCache = { kind: "ready", at: now };
    return { ok: true, logDetail: "connect_probe_succeeded" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "connect_probe_timeout") {
      connectProbeCache = { kind: "transient", at: now, message: "timeout" };
      logWarn("[stripe] Connect probe timed out — treating as unavailable for this request");
      return { ok: false, logDetail: "connect_probe_timeout" };
    }
    const connectDisabled = /signed up for Connect/i.test(msg);
    if (connectDisabled) {
      connectProbeCache = { kind: "connect_disabled", at: now };
      return { ok: false, logDetail: "stripe_connect_not_enabled_in_dashboard" };
    }
    connectProbeCache = { kind: "transient", at: now, message: msg.slice(0, 200) };
    logWarn("[stripe] Connect probe failed (transient?)", { message: msg.slice(0, 200) });
    return { ok: false, logDetail: `connect_probe_error: ${msg.slice(0, 200)}` };
  }
}

export type HostStripePayoutReadinessInput = {
  stripeAccountId: string | null | undefined;
  /** @deprecated Ignored for gating — Stripe `accounts.retrieve` is the source of truth. */
  stripeOnboardingComplete?: boolean | null | undefined;
};

/**
 * Validates BNHUB booking checkout: connected account must be fully enabled in Stripe
 * (`details_submitted`, `charges_enabled`, `payouts_enabled`) plus platform Connect probe.
 */
export async function validateHostStripePayoutReadiness(
  host: HostStripePayoutReadinessInput
): Promise<HostStripePayoutReadinessResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      code: "STRIPE_NOT_CONFIGURED",
      userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
      logDetail: "STRIPE_SECRET_KEY missing or invalid",
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      code: "STRIPE_NOT_CONFIGURED",
      userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
      logDetail: "stripe_client_unavailable",
    };
  }

  const accountId = host.stripeAccountId?.trim() || null;

  if (!accountId) {
    return {
      ok: false,
      code: "HOST_PAYOUT_NOT_CONFIGURED",
      userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
      logDetail: "host_missing_stripe_account_id",
    };
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    // eslint-disable-next-line no-console -- explicit debug visibility per platform Stripe readiness spec
    console.log("[STRIPE] readiness:", {
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });

    const isReady =
      account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true;

    if (!isReady) {
      return {
        ok: false,
        code: "HOST_PAYOUT_NOT_READY",
        userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
        logDetail: "Stripe account not fully enabled (charges/payouts)",
      };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      code: "HOST_PAYOUT_NOT_READY",
      userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
      logDetail: `stripe_accounts_retrieve_failed: ${msg}`,
    };
  }

  const platform = await probeStripeConnectPlatformEnabled();
  if (!platform.ok) {
    return {
      ok: false,
      code: "STRIPE_CONNECT_PLATFORM_UNAVAILABLE",
      userMessage: BNHUB_HOST_CHECKOUT_UNAVAILABLE_MESSAGE,
      logDetail: platform.logDetail,
    };
  }

  return { ok: true, code: "READY", userMessage: "", logDetail: "" };
}

/** @deprecated Use validateHostStripePayoutReadiness — alias for BNHUB naming consistency in routes. */
export const validateBnHubHostPayoutReadiness = validateHostStripePayoutReadiness;
