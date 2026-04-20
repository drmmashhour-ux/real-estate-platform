import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import type { LegalHubSummary } from "@/modules/legal/legal.types";
import type { TrustBadge, TrustScore } from "./trust.types";

function criticalCount(s?: LegalIntelligenceSummary | null): number {
  return s?.countsBySeverity?.critical ?? 0;
}

export type TrustBadgeContext = {
  persona?: "buyer" | "seller" | "broker" | "host";
  /** Best-effort readiness 0–100 when Legal Hub summary present */
  legalReadiness?: number | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  stripeOnboardingComplete?: boolean;
  brokerLicenseVerified?: boolean;
  /** Recent intelligence-style anomaly count surrogate (deterministic upstream) */
  recentAnomalyCount?: number;
};

/**
 * Badges are earned only — deterministic rules, no inflation.
 */
export function computeTrustBadges(
  trustScore: TrustScore,
  legalSummary: LegalHubSummary | null | undefined,
  intelligenceSummary: LegalIntelligenceSummary | null | undefined,
  ctx?: TrustBadgeContext,
): TrustBadge[] {
  try {
    const badges: TrustBadge[] = [];
    const crit = criticalCount(intelligenceSummary);
    const readiness =
      ctx?.legalReadiness ??
      legalSummary?.readinessScore?.score ??
      (legalSummary?.portfolio
        ? Math.round(
            (legalSummary.portfolio.completedWorkflows / Math.max(1, legalSummary.portfolio.totalWorkflows)) * 100,
          )
        : null);

    const persona = ctx?.persona ?? legalSummary?.actorType;
    const emailOk = Boolean(ctx?.emailVerified);
    const phoneOk = Boolean(ctx?.phoneVerified);
    const strongId = emailOk && phoneOk;

    if ((persona === "seller" || persona === "host") && strongId && readiness != null && readiness >= 70 && trustScore.level !== "low") {
      badges.push("verified_owner");
    }

    if (
      persona === "host" &&
      ctx?.stripeOnboardingComplete === true &&
      trustScore.level !== "low" &&
      trustScore.score >= 55
    ) {
      badges.push("verified_host");
    }

    if (
      persona === "broker" &&
      ctx?.brokerLicenseVerified === true &&
      crit === 0 &&
      (trustScore.level === "high" || trustScore.level === "verified" || trustScore.level === "premium")
    ) {
      badges.push("trusted_broker");
    }

    if (readiness != null && readiness >= 90 && crit === 0) {
      badges.push("high_compliance");
    }

    const anomalies = ctx?.recentAnomalyCount ?? 0;
    if (trustScore.score >= 95 && trustScore.level === "premium" && crit === 0 && anomalies === 0) {
      badges.push("premium_trusted");
    }

    return [...new Set(badges)];
  } catch {
    return [];
  }
}
