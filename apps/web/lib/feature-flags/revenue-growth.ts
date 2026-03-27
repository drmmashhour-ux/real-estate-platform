/** Server-side feature gates — read from env; never expose secrets to the client. */

export function isRevenueAnalyticsEnabled(): boolean {
  const v = process.env.REVENUE_ANALYTICS_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isLeadScoringEnabled(): boolean {
  const v = process.env.LEAD_SCORING_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isGrowthAutomationEnabled(): boolean {
  const v = process.env.GROWTH_AUTOMATION_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
