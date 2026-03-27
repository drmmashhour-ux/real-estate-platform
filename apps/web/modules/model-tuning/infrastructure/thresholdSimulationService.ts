import type { PrismaClient } from "@prisma/client";
import type { ModelValidationItem } from "@prisma/client";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { computeAllAgreements } from "@/modules/model-validation/infrastructure/agreementService";
import { computeCalibrationMetrics } from "@/modules/model-validation/infrastructure/calibrationMetricsService";
import { getRunWithItems } from "@/modules/model-validation/infrastructure/validationRepository";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { analyzeClusters } from "@/modules/model-validation/infrastructure/disagreementClusterService";
import type { SimulationDiffRow, SimulationResult } from "../domain/tuning.types";

function mapRec(r: string | undefined): string | null {
  if (!r) return null;
  return r;
}

export async function simulateTuningOnValidationRun(
  db: PrismaClient,
  validationRunId: string,
  tuningProfileId: string,
  config: TuningProfileConfig,
): Promise<SimulationResult> {
  const run = await getRunWithItems(db, validationRunId);
  if (!run) throw new Error("Validation run not found");

  const items = run.items;
  const beforeMetrics = computeCalibrationMetrics(items);
  const clustersBefore = analyzeClusters(items);

  const diffs: SimulationDiffRow[] = [];
  const synthetic: ModelValidationItem[] = [];

  for (const row of items) {
    if (row.entityType !== "fsbo_listing") {
      synthetic.push(row);
      continue;
    }

    const listingId = row.entityId;

    const trust = await calculateTrustScore(db, listingId, { persist: false, tuning: config });
    const fraud = await calculateFraudScore(db, listingId);

    let dealScore: number | null = null;
    let dealConf: number | null = null;
    let rec: string | null = row.predictedRecommendation ?? null;

    if (isDealAnalyzerEnabled()) {
      const d = await calculateDealScore(listingId, { persist: false, tuning: config });
      if (d) {
        dealScore = d.dealScore;
        dealConf = d.dealConfidence;
        rec = d.recommendation;
      }
    }

    const merged = {
      ...row,
      predictedTrustScore: trust?.trustScore ?? row.predictedTrustScore,
      predictedTrustConfidence: trust?.trustConfidence ?? row.predictedTrustConfidence,
      predictedDealScore: dealScore ?? row.predictedDealScore,
      predictedDealConfidence: dealConf ?? row.predictedDealConfidence,
      predictedFraudScore: fraud?.fraudScore ?? row.predictedFraudScore,
      predictedRecommendation: rec ?? row.predictedRecommendation,
    } as ModelValidationItem;

    const a = computeAllAgreements({
      predictedTrustScore: merged.predictedTrustScore,
      predictedRecommendation: merged.predictedRecommendation,
      predictedFraudScore: merged.predictedFraudScore,
      humanTrustLabel: merged.humanTrustLabel,
      humanDealLabel: merged.humanDealLabel,
      humanRiskLabel: merged.humanRiskLabel,
    });

    synthetic.push({
      ...merged,
      agreementTrust: a.agreementTrust,
      agreementDeal: a.agreementDeal,
      agreementRisk: a.agreementRisk,
    } as ModelValidationItem);

    diffs.push({
      itemId: row.id,
      entityId: row.entityId,
      before: {
        trustScore: row.predictedTrustScore,
        dealScore: row.predictedDealScore,
        recommendation: mapRec(row.predictedRecommendation ?? undefined),
        trustAgreement: row.agreementTrust,
        dealAgreement: row.agreementDeal,
      },
      after: {
        trustScore: merged.predictedTrustScore,
        dealScore: merged.predictedDealScore,
        recommendation: mapRec(merged.predictedRecommendation ?? undefined),
        trustAgreement: merged.agreementTrust,
        dealAgreement: merged.agreementDeal,
      },
    });
  }

  const afterMetrics = computeCalibrationMetrics(synthetic);

  return {
    validationRunId,
    tuningProfileId,
    beforeMetrics,
    afterMetrics,
    diffs,
    clustersBefore,
  };
}
