const REQUIRED_MODE = "mock";

const LIVE_ENV_KEYS = [
  "PAYMENT_LIVE_MODE",
  "LIVE_PAYMENTS_ENABLED",
  "REAL_MONEY_ENABLED",
  "VISA_API_KEY",
  "VISA_SECRET_KEY",
  "MASTERCARD_API_KEY",
  "MASTERCARD_SECRET_KEY",
  "BANK_API_KEY",
  "BANK_TRANSFER_API_KEY",
  "QNB_API_KEY",
  "STRIPE_SECRET_KEY",
] as const;

const TRUE_VALUES = new Set(["1", "true", "yes", "on", "live", "production", "enabled"]);

export interface FinancialSafetyState {
  mode: "mock";
  readOnly: true;
  liveExecutionAllowed: false;
  blockedKeys: readonly string[];
}

export function assertFinancialSafety(env: NodeJS.ProcessEnv = process.env): FinancialSafetyState {
  const mode = (env["PAYMENT_PLATFORM_MODE"] ?? REQUIRED_MODE).trim().toLowerCase();
  if (mode !== REQUIRED_MODE) {
    throw new Error("Financial platform is locked to mock mode. Live execution is disabled.");
  }

  const blockedKeys = LIVE_ENV_KEYS.filter((key) => {
    const value = env[key]?.trim().toLowerCase();
    if (!value) return false;
    return key.endsWith("_ENABLED") || key === "PAYMENT_LIVE_MODE"
      ? TRUE_VALUES.has(value)
      : true;
  });

  if (blockedKeys.length > 0) {
    throw new Error(`Live financial settings are rejected: ${blockedKeys.join(", ")}.`);
  }

  return {
    mode: REQUIRED_MODE,
    readOnly: true,
    liveExecutionAllowed: false,
    blockedKeys,
  };
}

export async function financialSafetyMiddleware<T>(
  operation: () => Promise<T>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  assertFinancialSafety(env);
  return operation();
}
