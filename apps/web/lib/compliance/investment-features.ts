export function isInvestmentFeaturesEnabled(): boolean {
  const v = process.env.LECIPM_INVESTMENT_FEATURES?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
