import type { LandingOptimizationRecommendation } from "@/modules/ads/landing-feedback-loop.service";
import { isPlatformCoreAuditEffective } from "@/config/feature-flags";
import { createAuditEvent } from "../platform-core.repository";

export async function ingestAdsLandingInsights(landing: LandingOptimizationRecommendation[] | undefined | null) {
  if (!landing?.length) return;
  if (!isPlatformCoreAuditEffective()) return;

  for (const insight of landing) {
    await createAuditEvent({
      eventType: "ADS_LANDING_INSIGHT",
      source: "ADS",
      entityType: "CAMPAIGN",
      entityId: null,
      message: insight.issueType,
      metadata: {
        kind: insight.kind,
        severity: insight.severity,
        evidenceScore: insight.evidenceScore,
        recommendation: insight.operatorAction,
        message: insight.message,
      },
    });
  }
}
