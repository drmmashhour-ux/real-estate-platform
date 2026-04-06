/**
 * Environment-driven hub flags (no secrets). Safe for client bundles when prefixed.
 */
export function isHubKeyEnvEnabled(envVar: string | undefined): boolean {
  if (!envVar) return false;
  const v = envVar.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** CarHub visible when explicitly enabled (default off). */
export function carHubEnvEnabled(): boolean {
  return isHubKeyEnvEnabled(process.env.NEXT_PUBLIC_HUB_CAR_ENABLED);
}

/** ServiceHub placeholder surface — default off in production. */
export function serviceHubEnvEnabled(): boolean {
  return isHubKeyEnvEnabled(process.env.NEXT_PUBLIC_HUB_SERVICE_ENABLED);
}

/** InvestorHub generic shell — internal/beta. */
export function investorHubEnvEnabled(): boolean {
  return isHubKeyEnvEnabled(process.env.NEXT_PUBLIC_HUB_INVESTOR_SHELL_ENABLED);
}
