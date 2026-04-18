import type { AssistantRecommendation, OperatorActionType, RecommendationConfidence } from "@/modules/operator/operator.types";
import type { CoreDecisionRecord } from "../platform-core.types";
import { normalizeConfidenceLabel } from "@/modules/operator/confidence-normalizer.service";

function adsV4ActionToOperator(actionType: string): OperatorActionType {
  switch (actionType) {
    case "ADS_SCALE_WINNER":
      return "SCALE_CAMPAIGN";
    case "ADS_PAUSE_LOSER":
      return "PAUSE_CAMPAIGN";
    case "ADS_TEST_NEW_VARIANT":
      return "TEST_NEW_VARIANT";
    case "LANDING_OPTIMIZATION_RECOMMENDED":
      return "UPDATE_CTA_PRIORITY";
    case "ADS_GEO_REALLOCATE":
    case "ADS_LOOP_REVIEW":
    case "ADS_HOLD_LOW_DATA":
    default:
      return "MONITOR";
  }
}

function confidenceFromScore(score: number): RecommendationConfidence {
  return normalizeConfidenceLabel(score);
}

/**
 * Maps Platform Core ADS decisions (from Ads V4 ingest) into assistant feed rows — no recompute of evidence.
 */
export function mapPlatformCoreAdsDecisionsToAssistant(rows: CoreDecisionRecord[]): AssistantRecommendation[] {
  return rows.map((d) => {
    const op = adsV4ActionToOperator(d.actionType);
    const meta = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : {};
    return {
      id: `platform-core:${d.id}`,
      source: "ADS",
      actionType: op,
      targetId: d.entityId,
      targetLabel: d.entityId,
      title: d.title,
      summary: d.summary,
      reason: d.reason,
      confidenceScore: d.confidenceScore,
      confidenceLabel: confidenceFromScore(d.confidenceScore),
      evidenceScore: d.evidenceScore,
      evidenceQuality:
        typeof meta.evidenceQuality === "string" ? (meta.evidenceQuality as "LOW" | "MEDIUM" | "HIGH") : undefined,
      expectedImpact: d.expectedImpact,
      operatorAction: typeof meta.adsOperatorAction === "string" ? meta.adsOperatorAction : d.expectedImpact,
      blockers: d.blockers,
      warnings: d.warnings,
      metrics: {
        platformCoreDecisionId: d.id,
        adsV4RecommendationType: d.actionType,
        loopId: meta.loopId,
        geo: meta.geo ?? null,
        learningSignals: meta.learningSignals ?? null,
        persistenceStatus: meta.persistenceStatus ?? null,
      },
      createdAt: d.createdAt,
    };
  });
}
