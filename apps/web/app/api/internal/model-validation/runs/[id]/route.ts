import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeCalibrationMetrics } from "@/modules/model-validation/infrastructure/calibrationMetricsService";
import { getRunWithItems } from "@/modules/model-validation/infrastructure/validationRepository";
import { requirePlatformAdmin } from "../../_auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  const run = await getRunWithItems(prisma, id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const metrics = computeCalibrationMetrics(run.items);

  return NextResponse.json({
    run: {
      id: run.id,
      name: run.name,
      description: run.description,
      status: run.status,
      validationRunKind: run.validationRunKind,
      appliedTuningProfileId: run.appliedTuningProfileId,
      comparisonTargetRunId: run.comparisonTargetRunId,
      createdBy: run.createdBy,
      createdAt: run.createdAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
    },
    metrics,
    items: run.items.map((i) => ({
      id: i.id,
      entityType: i.entityType,
      entityId: i.entityId,
      predictedTrustScore: i.predictedTrustScore,
      predictedTrustConfidence: i.predictedTrustConfidence,
      predictedDealScore: i.predictedDealScore,
      predictedDealConfidence: i.predictedDealConfidence,
      predictedFraudScore: i.predictedFraudScore,
      predictedRecommendation: i.predictedRecommendation,
      predictedIssueCodes: i.predictedIssueCodes,
      humanTrustLabel: i.humanTrustLabel,
      humanDealLabel: i.humanDealLabel,
      humanRiskLabel: i.humanRiskLabel,
      fairnessRating: i.fairnessRating,
      wouldPublish: i.wouldPublish,
      wouldContact: i.wouldContact,
      wouldInvestigateFurther: i.wouldInvestigateFurther,
      needsManualReview: i.needsManualReview,
      reviewerNotes: i.reviewerNotes,
      agreementTrust: i.agreementTrust,
      agreementDeal: i.agreementDeal,
      agreementRisk: i.agreementRisk,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  });
}
