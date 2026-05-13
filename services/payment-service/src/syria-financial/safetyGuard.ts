import { SyriaFinancialError } from "./errors.js";

export const SYBNB_FINANCIAL_REQUIRED_MODE = "mock" as const;

const UNSAFE_LIVE_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_LIVE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CHAMCASH_API_KEY",
  "CHAMCASH_SECRET_KEY",
  "QNB_API_KEY",
  "QNB_SECRET_KEY",
  "BANK_TRANSFER_ENABLED",
  "CARD_PROCESSING_ENABLED",
  "MASTERCARD_API_KEY",
  "LIVE_PAYMENTS_ENABLED",
  "PAYMENT_PROVIDER",
  "FEATURE_SYRIA_PROVIDER_QNB",
  "FEATURE_SYRIA_PROVIDER_CHAMCASH",
  "FEATURE_SYRIA_PAYOUTS",
] as const;

const TRUE_VALUES = new Set(["1", "true", "yes", "on", "live", "production", "enabled"]);

export interface SyriaFinancialSafetyState {
  mode: typeof SYBNB_FINANCIAL_REQUIRED_MODE;
  readOnly: true;
  liveProvidersAllowed: false;
  blockedEnvKeys: readonly string[];
}

export function getSyriaFinancialSafetyState(
  env: NodeJS.ProcessEnv = process.env,
): SyriaFinancialSafetyState {
  const requestedMode = (env["SYBNB_FINANCIAL_MODE"] ?? SYBNB_FINANCIAL_REQUIRED_MODE)
    .trim()
    .toLowerCase();
  if (requestedMode !== SYBNB_FINANCIAL_REQUIRED_MODE) {
    throw new SyriaFinancialError(
      "LIVE_PAYMENTS_DISABLED",
      "SYBNB financial modules are locked to mock read-only mode.",
      { statusCode: 403 },
    );
  }

  const blockedEnvKeys = UNSAFE_LIVE_ENV_KEYS.filter((key) => {
    const value = env[key]?.trim().toLowerCase();
    if (!value) return false;
    if (key.startsWith("FEATURE_SYRIA_")) return TRUE_VALUES.has(value);
    return true;
  });

  if (blockedEnvKeys.length > 0) {
    throw new SyriaFinancialError(
      "LIVE_PAYMENTS_DISABLED",
      `SYBNB financial modules reject live provider or execution settings: ${blockedEnvKeys.join(", ")}.`,
      { statusCode: 403 },
    );
  }

  return {
    mode: SYBNB_FINANCIAL_REQUIRED_MODE,
    readOnly: true,
    liveProvidersAllowed: false,
    blockedEnvKeys,
  };
}

export function assertSyriaFinancialReadOnlyMode(env: NodeJS.ProcessEnv = process.env): void {
  getSyriaFinancialSafetyState(env);
}
