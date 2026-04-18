/**
 * Env presence checks only — never returns secret values.
 */
export type ProviderConfigHealth = {
  metaConfigured: boolean;
  googleConfigured: boolean;
  missingKeys: string[];
  warnings: string[];
};

function hasEnv(key: string): boolean {
  return !!process.env[key]?.trim();
}

export function getProviderConfigHealth(): ProviderConfigHealth {
  const missingKeys: string[] = [];
  const warnings: string[] = [];

  const metaOk =
    hasEnv("META_ADS_ACCESS_TOKEN") || hasEnv("FACEBOOK_ADS_ACCESS_TOKEN") || hasEnv("META_MARKETING_API_ACCESS_TOKEN");
  if (!metaOk) {
    missingKeys.push("META_ADS_ACCESS_TOKEN or FACEBOOK_ADS_ACCESS_TOKEN or META_MARKETING_API_ACCESS_TOKEN");
    warnings.push("Meta Ads: no access token env detected — external sync writes will not run.");
  }

  const googleOk =
    hasEnv("GOOGLE_ADS_DEVELOPER_TOKEN") && hasEnv("GOOGLE_ADS_REFRESH_TOKEN") && hasEnv("GOOGLE_ADS_CUSTOMER_ID");
  if (!hasEnv("GOOGLE_ADS_DEVELOPER_TOKEN")) missingKeys.push("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!hasEnv("GOOGLE_ADS_REFRESH_TOKEN")) missingKeys.push("GOOGLE_ADS_REFRESH_TOKEN");
  if (!hasEnv("GOOGLE_ADS_CUSTOMER_ID")) missingKeys.push("GOOGLE_ADS_CUSTOMER_ID");
  if (!googleOk) {
    warnings.push("Google Ads: incomplete credential set — external sync writes will not run.");
  }

  return {
    metaConfigured: metaOk,
    googleConfigured: googleOk,
    missingKeys: [...new Set(missingKeys)],
    warnings,
  };
}
