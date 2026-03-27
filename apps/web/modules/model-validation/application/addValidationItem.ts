import type { PrismaClient } from "@prisma/client";
import { buildDecisionSnapshotForListing } from "@/lib/decision-engine/buildDecisionSnapshot";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import type { AddValidationItemInput } from "../domain/validation.types";
import { addItem, getRun } from "../infrastructure/validationRepository";

/**
 * Insert one calibration row. If `fillFromEngine` is true (default), loads trust/deal/fraud from engines for `fsbo_listing` entities.
 * When `tuningProfileId` is set, uses non-persisted trust/deal scoring with that profile (Round 2 tuned validation).
 * Manual fields in `input` override engine values.
 */
export async function addValidationItem(
  db: PrismaClient,
  runId: string,
  input: AddValidationItemInput & { fillFromEngine?: boolean },
) {
  const run = await getRun(db, runId);
  if (!run) throw new Error("Run not found");

  let merged: AddValidationItemInput = { ...input };
  const fill = input.fillFromEngine !== false;
  const isListing = input.entityType === "fsbo_listing" && fill;
  const tuningProfileId = input.tuningProfileId ?? null;

  if (isListing && tuningProfileId) {
    const profile = await db.tuningProfile.findUnique({ where: { id: tuningProfileId } });
    if (!profile) throw new Error("Tuning profile not found");
    const config = profile.config as TuningProfileConfig;

    const fraud = await calculateFraudScore(db, input.entityId);
    const codes: string[] = [];
    if (fraud?.signals?.length) {
      codes.push(...fraud.signals.map((s) => s.code));
    }

    const trust = await calculateTrustScore(db, input.entityId, { persist: false, tuning: config });
    if (trust) {
      codes.push(...trust.issueCodes);
    }

    merged = {
      ...merged,
      predictedFraudScore: merged.predictedFraudScore ?? fraud?.fraudScore ?? null,
      predictedTrustScore: merged.predictedTrustScore ?? trust?.trustScore ?? null,
      predictedTrustConfidence: merged.predictedTrustConfidence ?? trust?.trustConfidence ?? null,
    };

    if (isDealAnalyzerEnabled()) {
      const deal = await calculateDealScore(input.entityId, { persist: false, tuning: config });
      if (deal) {
        merged = {
          ...merged,
          predictedDealScore: merged.predictedDealScore ?? deal.dealScore ?? null,
          predictedDealConfidence: merged.predictedDealConfidence ?? deal.dealConfidence ?? null,
          predictedRecommendation: merged.predictedRecommendation ?? deal.recommendation ?? null,
        };
      }
    }

    merged = {
      ...merged,
      predictedIssueCodes: merged.predictedIssueCodes ?? (codes.length ? [...new Set(codes)].slice(0, 48) : null),
    };
  } else if (isListing) {
    const fraud = await calculateFraudScore(db, input.entityId);
    const codes: string[] = [];
    if (fraud?.signals?.length) {
      codes.push(...fraud.signals.map((s) => s.code));
    }

    merged = {
      ...merged,
      predictedFraudScore: merged.predictedFraudScore ?? fraud?.fraudScore ?? null,
    };

    if (isDealAnalyzerEnabled()) {
      const snapshot = await buildDecisionSnapshotForListing(input.entityId);
      if (snapshot) {
        codes.push(...snapshot.trust.issueCodes);
        merged = {
          ...merged,
          predictedTrustScore: merged.predictedTrustScore ?? snapshot.trust.trustScore ?? null,
          predictedTrustConfidence: merged.predictedTrustConfidence ?? snapshot.trust.trustConfidence ?? null,
          predictedDealScore: merged.predictedDealScore ?? snapshot.deal.dealScore ?? null,
          predictedDealConfidence: merged.predictedDealConfidence ?? snapshot.deal.dealConfidence ?? null,
          predictedRecommendation: merged.predictedRecommendation ?? snapshot.deal.recommendation ?? null,
        };
      }
    }

    merged = {
      ...merged,
      predictedIssueCodes: merged.predictedIssueCodes ?? (codes.length ? [...new Set(codes)].slice(0, 48) : null),
    };
  }

  const { fillFromEngine: _f, tuningProfileId: _t, ...rest } = merged as AddValidationItemInput & {
    fillFromEngine?: boolean;
    tuningProfileId?: string | null;
  };
  const item = await addItem(db, runId, rest);

  if (run.status === "draft") {
    await db.modelValidationRun.update({
      where: { id: runId },
      data: { status: "in_progress" },
    });
  }

  return item;
}
