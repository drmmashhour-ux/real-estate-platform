import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { loadDisputePredictionObservabilityForCommandCenter } from "@/modules/dispute-prediction/dispute-prediction-dashboard.service";

import { proposeSystemAdjustment } from "./ai-ceo-system-adjustment-policy.service";

export type AiCeoRiskAdjustmentDraft = {
  title: string;
  affectedDomain: string;
  territory?: string | null;
  segment?: string | null;
  hub?: string | null;
  expectedImpactBand: string;
  confidence: number;
  urgency: string;
  recommendedAdjustment: string;
  explanation: string;
};

/**
 * Consumes dispute-prediction observability and drafts **bounded** system-change proposals (review workflow — never auto-punitive).
 */
export async function generateAiCeoRiskAdjustmentsFromPredictions(input?: {
  actorUserId?: string | null;
  persistProposals?: boolean;
}): Promise<{ drafts: AiCeoRiskAdjustmentDraft[]; persistedIds: string[] }> {
  const obs = await loadDisputePredictionObservabilityForCommandCenter();
  const drafts: AiCeoRiskAdjustmentDraft[] = [];

  const highCriticalCount = obs.riskBandTrend30d
    .filter((x) => x.band === "HIGH" || x.band === "CRITICAL")
    .reduce((a, x) => a + x.count, 0);
  if (highCriticalCount >= 3) {
    drafts.push({
      title: "Tighten confirmation & neutral reminders in high-friction corridors",
      affectedDomain: "bnhub_booking",
      territory: "QC",
      hub: "BNHub",
      expectedImpactBand: "moderate",
      confidence: 0.62,
      urgency: "medium",
      recommendedAdjustment:
        "Increase neutral confirmation prompts and reduce aggressive follow-up cadence until response metrics stabilize.",
      explanation:
        `Elevated HIGH/CRITICAL dispute-risk snapshots in the last 30d (n≈${highCriticalCount}). Advisory — requires human approval before automation policy changes.`,
    });
  }

  const cats = obs.highRiskZones.filter((z) => z.predictedCategory === "NEGOTIATION_BREAKDOWN");
  if (cats.length >= 2) {
    drafts.push({
      title: "Negotiation stall coaching — broker segment assist",
      affectedDomain: "deal_pipeline",
      segment: "broker_owner",
      expectedImpactBand: "meaningful",
      confidence: 0.55,
      urgency: "high",
      recommendedAdjustment:
        "Route stalled negotiation signals to assistive broker coaching templates; avoid punitive listing suppression.",
      explanation:
        "Multiple deal entities show negotiation-breakdown prediction cluster — operational coaching over penalties.",
    });
  }

  if (obs.highRiskZones.some((z) => z.predictedCategory === "DOCUMENTATION_GAP")) {
    drafts.push({
      title: "Compliance gate visibility for documentation-gap clusters",
      affectedDomain: "compliance_gates",
      expectedImpactBand: "moderate",
      confidence: 0.58,
      urgency: "medium",
      recommendedAdjustment:
        "Raise checklist visibility and optional manual review threshold for listings/deals with documentation-gap prediction.",
      explanation:
        "Documentation-gap predictions correlate with preventable friction — strengthen assistive gates, not automatic blocks.",
    });
  }

  const persistedIds: string[] = [];
  if (input?.persistProposals) {
    for (const d of drafts) {
      const row = await proposeSystemAdjustment({
        title: d.title,
        affectedDomain: d.affectedDomain,
        territory: d.territory ?? undefined,
        segment: d.segment ?? undefined,
        hub: d.hub ?? undefined,
        impactBand: d.expectedImpactBand,
        confidence: d.confidence,
        urgency: d.urgency,
        recommendedAdjustment: d.recommendedAdjustment,
        explanation: d.explanation,
        proposedByUserId: input.actorUserId ?? null,
      });
      persistedIds.push(row.id);
    }
  }

  return { drafts, persistedIds };
}

export async function listPersistedRiskAdjustments(take = 30) {
  return prisma.lecipmSystemBehaviorAdjustment.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
