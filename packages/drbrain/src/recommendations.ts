import type { DrBrainCheckResult } from "./types";

/**
 * Pure recommendation strings — no auto-remediation.
 */
export function buildRecommendations(results: DrBrainCheckResult[]): string[] {
  const recs = new Set<string>();

  for (const r of results) {
    if (r.level !== "WARNING" && r.level !== "CRITICAL") continue;
    if (r.check.startsWith("env.") || r.message.toLowerCase().includes("isolation")) {
      recs.add("Fix environment isolation immediately — do not deploy until DATABASE_URL matches this app.");
    }
    if (r.check.startsWith("database.")) {
      recs.add("Verify DATABASE_URL with your provider (Neon/Supabase), TLS (sslmode=require), and migrations.");
    }
    if (r.check.startsWith("payments.")) {
      recs.add("Review SYBNB payment/payout gates, kill switches, escrow, and webhook secrets before enabling live rails.");
    }
    if (r.check.startsWith("build.")) {
      recs.add("Fix compile/type errors before deployment.");
    }
    if (r.check.startsWith("security.")) {
      recs.add("Review security configuration (NODE_ENV, headers, TLS).");
    }
    if (r.check.startsWith("anomalies.")) {
      recs.add("Investigate anomaly signals (rates, blocked flows, fraud posture).");
    }
  }

  if (recs.size === 0) {
    recs.add("Continue periodic monitoring — DR.BRAIN detected no actionable recommendations.");
  }

  return [...recs];
}
