import {
  Prisma,
  TrustLevel,
  VerificationCaseStatus,
  VerificationEntityType,
  VerificationSeverity,
  VerificationSignalCategory,
  VerificationSignalStatus,
} from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { TrustLevelBand, TrustScoreResult } from "../domain/trustScore.types";
import { trustLevelBand } from "../domain/trustScore.types";
import {
  computeTrustComponents,
  trustScoreRawWeighted,
} from "../infrastructure/trustSignalsService";
import { aggregateTrustConfidence, computeTrustConfidence } from "../infrastructure/trustConfidenceService";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { findDuplicateImageListingIds } from "@/modules/fraud-risk/infrastructure/fraudGraphService";
import { confidenceMultiplier } from "@/modules/scoring/confidenceMultiplier";
import {
  confidenceMultiplierWithProfile,
  sumIssueCodePenalties,
  trustLevelBandWithThresholds,
  type TuningProfileConfig,
} from "@/modules/scoring/tuningProfile";

function mapBandToTrustLevel(band: TrustLevelBand): TrustLevel {
  if (band === "verified") return TrustLevel.verified;
  if (band === "high") return TrustLevel.high;
  if (band === "medium") return TrustLevel.medium;
  return TrustLevel.low;
}

export type CalculateTrustScoreOptions = {
  persist?: boolean;
  tuning?: TuningProfileConfig | null;
};

/**
 * Numeric trust score (tables + banded confidence multiplier) — persists `fsbo_listings.trust_score` unless `persist: false`.
 */
export async function calculateTrustScore(
  db: PrismaClient,
  listingId: string,
  options?: CalculateTrustScoreOptions,
): Promise<TrustScoreResult | null> {
  const persist = options?.persist !== false;
  const tuning = options?.tuning ?? null;

  const listing = await db.fsboListing.findUnique({
    where: { id: listingId },
    include: { verification: true },
  });
  if (!listing) return null;

  const fraud = await calculateFraudScore(db, listingId);
  const fraudPenalty = fraud?.trustPenaltyPoints ?? 0;

  const images = Array.isArray(listing.images) ? listing.images : [];
  const dupIds = await findDuplicateImageListingIds(db, listingId, images);

  const { breakdown, issues, strengths, issueCodes, strengthCodes } = computeTrustComponents({
    listing: { ...listing, images: listing.images },
    hasDuplicateImagesAcrossListings: dupIds.length > 0,
  });

  const tags = listing.photoTagsJson;
  const tagArr = Array.isArray(tags) ? tags.filter((x): x is string => typeof x === "string") : [];

  const confidenceBreakdown = computeTrustConfidence({
    listing: { ...listing, verification: listing.verification },
    images,
    tagArr,
  });
  const trustConfidence = aggregateTrustConfidence(confidenceBreakdown);

  const trustScoreRaw = trustScoreRawWeighted(breakdown);
  const mult = tuning?.confidenceMultiplierBands
    ? confidenceMultiplierWithProfile(trustConfidence, tuning.confidenceMultiplierBands)
    : confidenceMultiplier(trustConfidence);
  let trustScore = Math.min(100, Math.max(0, Math.round(trustScoreRaw * mult) - fraudPenalty));

  const uniqueIssues = [...new Set(issues)].slice(0, 20);
  const uniqueStrengths = [...new Set(strengths)].slice(0, 12);
  const uniqueIssueCodes = [...new Set(issueCodes)].slice(0, 24);
  const uniqueStrengthCodes = [...new Set(strengthCodes)].slice(0, 16);

  const extraPenalty = sumIssueCodePenalties(uniqueIssueCodes, tuning?.issueCodePenalties);
  trustScore = Math.min(100, Math.max(0, trustScore - extraPenalty));

  const level = tuning?.trustBucketThresholds
    ? trustLevelBandWithThresholds(trustScore, tuning.trustBucketThresholds)
    : trustLevelBand(trustScore);

  if (!persist) {
    return {
      trustScore,
      trustScoreRaw,
      trustConfidence,
      fraudPenalty,
      level,
      issues: uniqueIssues,
      strengths: uniqueStrengths,
      issueCodes: uniqueIssueCodes,
      strengthCodes: uniqueStrengthCodes,
      breakdown,
      confidenceBreakdown,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.fsboListing.update({
      where: { id: listingId },
      data: { trustScore },
    });

    const existing = await tx.verificationCase.findFirst({
      where: { entityType: VerificationEntityType.LISTING, entityId: listingId },
      orderBy: { updatedAt: "desc" },
    });

    const scoreBreakdown = {
      components: breakdown,
      confidence: confidenceBreakdown,
      trustScoreRaw,
      trustConfidence,
      confidenceMultiplier: mult,
      fraudPenalty,
      fraudScore: fraud?.fraudScore ?? null,
      engine: "lecipm_trust_score_v3_numeric",
    };

    const caseRow = existing
      ? await tx.verificationCase.update({
          where: { id: existing.id },
          data: {
            overallScore: trustScore,
            trustLevel: mapBandToTrustLevel(level),
            status: VerificationCaseStatus.pending,
            scoreBreakdown: scoreBreakdown as object,
            summary: {
              issues: uniqueIssues,
              strengths: uniqueStrengths,
              issueCodes: uniqueIssueCodes,
              strengthCodes: uniqueStrengthCodes,
            } as object,
          },
        })
      : await tx.verificationCase.create({
          data: {
            entityType: VerificationEntityType.LISTING,
            entityId: listingId,
            status: VerificationCaseStatus.pending,
            overallScore: trustScore,
            trustLevel: mapBandToTrustLevel(level),
            scoreBreakdown: scoreBreakdown as object,
            summary: {
              issues: uniqueIssues,
              strengths: uniqueStrengths,
              issueCodes: uniqueIssueCodes,
              strengthCodes: uniqueStrengthCodes,
            } as object,
          },
        });

    await tx.verificationSignal.deleteMany({ where: { caseId: caseRow.id } });

    let ord = 0;
    const signalRows: Prisma.VerificationSignalCreateManyInput[] = [];

    for (const msg of uniqueIssues) {
      ord += 1;
      signalRows.push({
        caseId: caseRow.id,
        signalCode: `trust_issue_${ord}`,
        signalName: msg.slice(0, 120),
        category: VerificationSignalCategory.quality,
        severity: VerificationSeverity.medium,
        status: VerificationSignalStatus.open,
        scoreImpact: -Math.min(15, 5 + Math.floor(msg.length / 40)),
        message: msg,
      });
    }
    for (const msg of uniqueStrengths) {
      ord += 1;
      signalRows.push({
        caseId: caseRow.id,
        signalCode: `trust_strength_${ord}`,
        signalName: msg.slice(0, 120),
        category: VerificationSignalCategory.quality,
        severity: VerificationSeverity.info,
        status: VerificationSignalStatus.open,
        scoreImpact: 3,
        message: msg,
      });
    }

    if (signalRows.length) {
      await tx.verificationSignal.createMany({ data: signalRows });
    }
  });

  return {
    trustScore,
    trustScoreRaw,
    trustConfidence,
    fraudPenalty,
    level,
    issues: uniqueIssues,
    strengths: uniqueStrengths,
    issueCodes: uniqueIssueCodes,
    strengthCodes: uniqueStrengthCodes,
    breakdown,
    confidenceBreakdown,
  };
}
