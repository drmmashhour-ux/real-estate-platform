/**
 * Fast env-based go/no-go checks (complements `runLaunchReadinessChecks` in `readiness-checks.ts`).
 */
export function runLaunchChecks(): { ready: boolean; issues: string[] } {
  const checks: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    checks.push("Missing DATABASE_URL");
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    checks.push("Missing Stripe configuration");
  }

  return {
    ready: checks.length === 0,
    issues: checks,
  };
}
