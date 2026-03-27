/** Staging / demo: blend synthetic trends for empty or thin datasets. */
export function isInvestorMetricsDemoMode(): boolean {
  return (
    process.env.INVESTOR_METRICS_DEMO === "true" ||
    process.env.NEXT_PUBLIC_ENV === "staging" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export function isInvestorDemoLoginEnabled(): boolean {
  return (
    process.env.INVESTOR_DEMO_LOGIN === "true" ||
    process.env.NEXT_PUBLIC_ENV === "staging" ||
    !!(process.env.NODE_ENV !== "production" && process.env.INVESTOR_DEMO_EMAIL)
  );
}
