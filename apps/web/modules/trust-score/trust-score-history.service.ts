import type { LecipmTrustEngineTargetType, PrismaClient } from "@prisma/client";

import { computeOperationalTrust } from "./trust-score.engine";
import { buildOperationalTrustExplainability } from "./trust-score-explainability.service";
import { aggregateOperationalTrustInputs } from "./trust-score-inputs.service";
import { operationalTrustRankingModifier } from "./trust-score-ranking.service";
import { logTrustDelta, logTrustScore } from "./trust-score-log";
import { TRUST_WEIGHT_PROFILE_VERSION } from "./trust-score-weights.service";
import type { OperationalTrustResult, TrustHistoryEntry } from "./trust-score.types";

export type PersistedOperationalTrust = {
  snapshotId: string;
  result: OperationalTrustResult;
  deltaFromPrior: number | null;
  ranking: ReturnType<typeof operationalTrustRankingModifier>;
};

function parseContributingFactors(json: unknown): OperationalTrustResult["contributingFactors"] {
  if (!Array.isArray(json)) return [];
  return json as OperationalTrustResult["contributingFactors"];
}

function topNegativeFactorId(factors: OperationalTrustResult["contributingFactors"]): string | undefined {
  const neg = factors.filter((c) => c.contribution < -0.25).sort((a, b) => a.contribution - b.contribution);
  return neg[0]?.factorId;
}

/**
 * Full pipeline: aggregate inputs → compute score → persist snapshot → optional alerts.
 */
export async function computePersistOperationalTrust(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
  targetId: string,
): Promise<PersistedOperationalTrust> {
  const inputs = await aggregateOperationalTrustInputs(db, targetType, targetId);
  const prior = await db.lecipmOperationalTrustSnapshot.findFirst({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
  });

  let result = computeOperationalTrust(inputs);
  if (prior) {
    const priorFactors = parseContributingFactors(prior.contributingFactorsJson);
    const priorNegIds = priorFactors
      .filter((c) => c.contribution < -0.25)
      .sort((a, b) => a.contribution - b.contribution)
      .slice(0, 3)
      .map((c) => c.factorId);
    result = {
      ...result,
      explain: buildOperationalTrustExplainability({
        trustScore: result.trustScore,
        trustBand: result.trustBand,
        contributions: result.contributingFactors,
        warnings: result.warnings,
        thinDataNotes: inputs.thinDataNotes,
        priorScore: prior.trustScore,
        priorTopNegativeFactorIds: priorNegIds,
      }),
    };
  }

  const deltaFromPrior = prior ? result.trustScore - prior.trustScore : null;

  const snapshot = await db.lecipmOperationalTrustSnapshot.create({
    data: {
      targetType,
      targetId,
      trustScore: result.trustScore,
      trustBand: result.trustBand,
      contributingFactorsJson: result.contributingFactors as object[],
      warningsJson: result.warnings,
      explainJson: result.explain as object,
      deltaFromPrior,
      weightProfileVersion: TRUST_WEIGHT_PROFILE_VERSION,
      inputsSummaryJson: {
        factorCount: inputs.factors.length,
        thinDataNotes: inputs.thinDataNotes,
        warnings: inputs.warnings,
      },
    },
  });

  const ranking = operationalTrustRankingModifier(result.trustScore, result.trustBand, true);

  logTrustScore("snapshot_persisted", {
    snapshotId: snapshot.id,
    targetType,
    targetId,
    trustScore: result.trustScore,
    trustBand: result.trustBand,
  });
  if (deltaFromPrior != null) {
    logTrustDelta("delta_recorded", {
      targetType,
      targetId,
      deltaFromPrior,
      prior: prior?.trustScore,
    });
  }

  await maybeCreateTrustAlerts(db, targetType, targetId, result, deltaFromPrior, prior?.id ?? null);

  return {
    snapshotId: snapshot.id,
    result,
    deltaFromPrior,
    ranking,
  };
}

export async function getLatestOperationalTrustSnapshot(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
  targetId: string,
) {
  return db.lecipmOperationalTrustSnapshot.findFirst({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOperationalTrustHistory(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
  targetId: string,
  limit = 24,
): Promise<TrustHistoryEntry[]> {
  const rows = await db.lecipmOperationalTrustSnapshot.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => {
    const factors = parseContributingFactors(r.contributingFactorsJson);
    const changedFactorHints = factors.slice(0, 5).map((f) => f.factorId);
    return {
      trustScore: r.trustScore,
      trustBand: r.trustBand,
      deltaFromPrior: r.deltaFromPrior,
      changedFactorHints,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

async function maybeCreateTrustAlerts(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
  targetId: string,
  result: OperationalTrustResult,
  deltaFromPrior: number | null,
  priorSnapshotId: string | null,
) {
  const metaBase = {
    trustScore: result.trustScore,
    band: result.trustBand,
    priorSnapshotId,
  };

  if (deltaFromPrior != null && deltaFromPrior <= -12) {
    await db.lecipmOperationalTrustAlert.create({
      data: {
        targetType,
        targetId,
        alertKind: "SHARP_DROP",
        severity: "high",
        message:
          "Operational trust score dropped sharply — review queues and lightweight verification (advisory; not fault).",
        metadataJson: { ...metaBase, deltaFromPrior },
      },
    });
    logTrustDelta("alert_sharp_drop", { targetType, targetId, deltaFromPrior });
  }

  if (result.trustBand === "CRITICAL_REVIEW") {
    await db.lecipmOperationalTrustAlert.create({
      data: {
        targetType,
        targetId,
        alertKind: "CRITICAL_BAND",
        severity: "high",
        message:
          "Target entered CRITICAL_REVIEW operational band — human policy review before major visibility suppression.",
        metadataJson: metaBase,
      },
    });
  }

  if (deltaFromPrior != null && deltaFromPrior >= 15) {
    await db.lecipmOperationalTrustAlert.create({
      data: {
        targetType,
        targetId,
        alertKind: "STRONG_IMPROVEMENT",
        severity: "low",
        message: "Large operational trust improvement detected — suitable for celebrating coaching wins (still advisory).",
        metadataJson: { ...metaBase, deltaFromPrior },
      },
    });
  }

  const worstId = topNegativeFactorId(result.contributingFactors);
  if (worstId) {
    const recent = await db.lecipmOperationalTrustSnapshot.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { contributingFactorsJson: true },
    });
    let streak = 0;
    for (const row of recent) {
      const fid = topNegativeFactorId(parseContributingFactors(row.contributingFactorsJson));
      if (fid === worstId) streak += 1;
    }
    if (streak >= 3) {
      await db.lecipmOperationalTrustAlert.create({
        data: {
          targetType,
          targetId,
          alertKind: "REPEATED_NEGATIVE_DRIVER",
          severity: "medium",
          message: `Operational factor '${worstId}' repeatedly anchors downside — review operational playbooks.`,
          metadataJson: { ...metaBase, repeatedFactorId: worstId },
        },
      });
    }
  }
}
