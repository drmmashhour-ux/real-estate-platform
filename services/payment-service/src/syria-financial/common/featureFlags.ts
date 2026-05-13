export const syriaFinancialFeatureFlagNames = [
  "FEATURE_SYRIA_WALLET",
  "FEATURE_SYRIA_PAYOUTS",
  "FEATURE_SYRIA_KYC",
  "FEATURE_SYRIA_PROVIDER_QNB",
  "FEATURE_SYRIA_PROVIDER_CHAMCASH",
  "FEATURE_SYRIA_RISK_ENGINE",
  "FEATURE_SYRIA_ADMIN_FINANCIAL_DASHBOARD",
] as const;

export type SyriaFinancialFeatureFlagName = (typeof syriaFinancialFeatureFlagNames)[number];
export type SyriaFinancialFeatureFlags = Record<SyriaFinancialFeatureFlagName, boolean>;

export const defaultSyriaFinancialFeatureFlags: SyriaFinancialFeatureFlags = {
  FEATURE_SYRIA_WALLET: false,
  FEATURE_SYRIA_PAYOUTS: false,
  FEATURE_SYRIA_KYC: false,
  FEATURE_SYRIA_PROVIDER_QNB: false,
  FEATURE_SYRIA_PROVIDER_CHAMCASH: false,
  FEATURE_SYRIA_RISK_ENGINE: false,
  FEATURE_SYRIA_ADMIN_FINANCIAL_DASHBOARD: false,
};

export function readSyriaFinancialFeatureFlags(env: NodeJS.ProcessEnv = process.env): SyriaFinancialFeatureFlags {
  return {
    FEATURE_SYRIA_WALLET: env["FEATURE_SYRIA_WALLET"] === "true",
    FEATURE_SYRIA_PAYOUTS: env["FEATURE_SYRIA_PAYOUTS"] === "true",
    FEATURE_SYRIA_KYC: env["FEATURE_SYRIA_KYC"] === "true",
    FEATURE_SYRIA_PROVIDER_QNB: env["FEATURE_SYRIA_PROVIDER_QNB"] === "true",
    FEATURE_SYRIA_PROVIDER_CHAMCASH: env["FEATURE_SYRIA_PROVIDER_CHAMCASH"] === "true",
    FEATURE_SYRIA_RISK_ENGINE: env["FEATURE_SYRIA_RISK_ENGINE"] === "true",
    FEATURE_SYRIA_ADMIN_FINANCIAL_DASHBOARD:
      env["FEATURE_SYRIA_ADMIN_FINANCIAL_DASHBOARD"] === "true",
  };
}

export function isSyriaFinancialFeatureEnabled(
  flagName: SyriaFinancialFeatureFlagName,
  flags: SyriaFinancialFeatureFlags = readSyriaFinancialFeatureFlags(),
): boolean {
  return flags[flagName] === true;
}
