import { SyriaFinancialError } from "./errors.js";

export const SYRIA_FINANCIAL_FEATURE_FLAG_NAMES = [
  "FEATURE_SYRIA_WALLET",
  "FEATURE_SYRIA_PAYOUTS",
  "FEATURE_SYRIA_KYC",
  "FEATURE_SYRIA_PROVIDER_QNB",
  "FEATURE_SYRIA_PROVIDER_CHAMCASH",
  "FEATURE_SYRIA_RISK_ENGINE",
] as const;

export type SyriaFinancialFeatureFlag = (typeof SYRIA_FINANCIAL_FEATURE_FLAG_NAMES)[number];
export type SyriaFinancialFeatureFlagState = Record<SyriaFinancialFeatureFlag, boolean>;

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function getSyriaFinancialFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): SyriaFinancialFeatureFlagState {
  return SYRIA_FINANCIAL_FEATURE_FLAG_NAMES.reduce((state, flag) => {
    state[flag] = TRUE_VALUES.has((env[flag] ?? "").trim().toLowerCase());
    return state;
  }, {} as SyriaFinancialFeatureFlagState);
}

export function assertSyriaFinancialFeatureEnabled(
  flag: SyriaFinancialFeatureFlag,
  flags: SyriaFinancialFeatureFlagState = getSyriaFinancialFeatureFlags(),
): void {
  if (!flags[flag]) {
    throw new SyriaFinancialError(
      "SYRIA_FINANCE_DISABLED",
      `${flag} is disabled. Syria financial systems are off by default.`,
      { statusCode: 403 },
    );
  }
}

export function anySyriaFinancialFeatureEnabled(
  flags: SyriaFinancialFeatureFlagState = getSyriaFinancialFeatureFlags(),
): boolean {
  return SYRIA_FINANCIAL_FEATURE_FLAG_NAMES.some((flag) => flags[flag]);
}
