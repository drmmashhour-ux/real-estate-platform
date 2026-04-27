import type { DrBrainAppId, DrBrainCheckResult } from "../types";

/**
 * Configuration-only checks — never calls Stripe or other PSPs.
 */
export function runPaymentsChecks(input: {
  appId: DrBrainAppId;
  env: Record<string, string | undefined>;
}): DrBrainCheckResult[] {
  const { appId, env } = input;
  const results: DrBrainCheckResult[] = [];

  if (appId !== "syria") {
    results.push({
      appId,
      check: "payments.scope",
      level: "INFO",
      ok: true,
      message: "SYBNB payment rails checks skipped (non-Syria app).",
    });
    return results;
  }

  const provider = (env.SYBNB_PAYMENT_PROVIDER ?? "manual").toLowerCase();
  const prodLock = env.SYBNB_PRODUCTION_LOCK_MODE !== "false";
  const paymentsEnabled = env.SYBNB_PAYMENTS_ENABLED === "true";
  const payKill = env.SYBNB_PAYMENTS_KILL_SWITCH === "true";
  const payoutKill = env.SYBNB_PAYOUTS_KILL_SWITCH === "true";
  const escrow = env.SYBNB_ESCROW_ENABLED !== "false";
  const autoRelease = env.SYBNB_AUTO_RELEASE_PAYOUTS === "true";

  results.push({
    appId,
    check: "payments.provider",
    level: "INFO",
    ok: true,
    message: `SYBNB_PAYMENT_PROVIDER=${provider}`,
  });

  results.push({
    appId,
    check: "payments.production_lock",
    level: prodLock ? "OK" : "WARNING",
    ok: prodLock,
    message: prodLock
      ? "SYBNB production lock engaged (SYBNB_PRODUCTION_LOCK_MODE unset or true)."
      : "SYBNB_PRODUCTION_LOCK_MODE=false — only use in controlled staging/sandbox.",
  });

  results.push({
    appId,
    check: "payments.kill_switch_payments",
    level: payKill ? "INFO" : "OK",
    ok: true,
    message: payKill ? "SYBNB_PAYMENTS_KILL_SWITCH is ON — card rails blocked." : "Payments kill switch off.",
  });

  results.push({
    appId,
    check: "payments.kill_switch_payouts",
    level: payoutKill ? "INFO" : "OK",
    ok: true,
    message: payoutKill ? "SYBNB_PAYOUTS_KILL_SWITCH is ON — payout transitions blocked." : "Payout kill switch off.",
  });

  results.push({
    appId,
    check: "payments.enabled_vs_lock",
    level: paymentsEnabled && prodLock ? "INFO" : "OK",
    ok: true,
    message:
      paymentsEnabled && prodLock
        ? "SYBNB_PAYMENTS_ENABLED=true while production lock is on — app layer still gates effective rails."
        : "Payments enabled flag reviewed.",
  });

  results.push({
    appId,
    check: "payments.escrow",
    level: escrow ? "OK" : "CRITICAL",
    ok: escrow,
    message: escrow ? "Escrow enabled (SYBNB_ESCROW_ENABLED not false)." : "Escrow disabled — unsafe for marketplace payouts.",
  });

  results.push({
    appId,
    check: "payments.auto_release",
    level: autoRelease ? "CRITICAL" : "OK",
    ok: !autoRelease,
    message: autoRelease ? "SYBNB_AUTO_RELEASE_PAYOUTS must stay off until explicitly approved." : "Auto payout release off.",
  });

  if (provider === "stripe") {
    const hasWebhook =
      Boolean(env.SYBNB_STRIPE_WEBHOOK_SECRET?.trim()) || Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
    results.push({
      appId,
      check: "payments.stripe_webhook_secret",
      level: hasWebhook ? "OK" : "CRITICAL",
      ok: hasWebhook,
      message: hasWebhook
        ? "Stripe webhook secret configured (presence only)."
        : "Stripe provider requires SYBNB_STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET.",
    });
  }

  return results;
}
