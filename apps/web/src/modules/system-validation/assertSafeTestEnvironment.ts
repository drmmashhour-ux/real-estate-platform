/**
 * Guards so full LECIPM system validation never touches production by accident.
 * Requires TEST_MODE=true and blocks production NODE_ENV unless explicitly overridden.
 */

export type StripeModeCheck = { sandboxOnly: boolean; notes: string[] };

export function assertSystemValidationAllowed(): void {
  if (process.env.TEST_MODE !== "true") {
    throw new Error(
      "System validation refused: set TEST_MODE=true (isolated test environment only).",
    );
  }
  if (process.env.NODE_ENV === "production" && process.env.LECIPM_ALLOW_SYSTEM_VALIDATION_IN_PRODUCTION !== "true") {
    throw new Error(
      "System validation refused in production NODE_ENV. Set LECIPM_ALLOW_SYSTEM_VALIDATION_IN_PRODUCTION=true only on a dedicated staging instance.",
    );
  }
}

/**
 * For billing-related steps: never use live Stripe keys during automated validation.
 */
export function assertStripeSandboxForBillingSimulation(): StripeModeCheck {
  const notes: string[] = [];
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) {
    notes.push("STRIPE_SECRET_KEY unset — billing simulation uses DB plan flip only (no Checkout).");
    return { sandboxOnly: true, notes };
  }
  if (key.startsWith("sk_live_")) {
    throw new Error(
      "System validation refused: STRIPE_SECRET_KEY is a live key. Use sk_test_* or unset for dry billing.",
    );
  }
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "System validation refused: STRIPE_SECRET_KEY must be sk_test_* or unset for automated billing simulation.",
    );
  }
  notes.push("STRIPE_SECRET_KEY is test mode — safe for Checkout smoke against Stripe test clocks.");
  return { sandboxOnly: true, notes };
}

export function isRealPaymentOrchestrationEnabled(): boolean {
  return process.env.LECIPM_E2E_REAL_STRIPE_CHECKOUT === "true";
}
