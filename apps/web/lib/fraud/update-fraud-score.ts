import type { FraudEntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SIGNAL_WINDOW_MS } from "@/lib/fraud/rules";
import { recommendActionFromScore, scoreToRiskLevel } from "@/lib/fraud/recommend-action";
import { clampScore } from "@/lib/fraud/validators";
import { openFraudCaseIfNeeded } from "@/lib/fraud/open-fraud-case";

function topSignals(
  rows: { signalType: string; riskPoints: number }[],
  limit = 8
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of rows) {
    map[r.signalType] = (map[r.signalType] ?? 0) + r.riskPoints;
  }
  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  return Object.fromEntries(sorted);
}

/**
 * Recompute rolling fraud policy score from `FraudSignalEvent` rows in the signal window.
 */
export async function updateFraudScoreForEntity(entityType: FraudEntityType, entityId: string): Promise<void> {
  const since = new Date(Date.now() - SIGNAL_WINDOW_MS);
  const rows = await prisma.fraudSignalEvent.findMany({
    where: { entityType, entityId, createdAt: { gte: since } },
    select: { signalType: true, riskPoints: true },
  });
  const raw = rows.reduce((a, r) => a + r.riskPoints, 0);
  const score = clampScore(raw);
  const riskLevel = scoreToRiskLevel(score);
  const recommendedAction = recommendActionFromScore(score);
  const reasonsJson = { topSignals: topSignals(rows), windowMs: SIGNAL_WINDOW_MS } as Prisma.InputJsonValue;

  await prisma.fraudPolicyScore.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    create: {
      entityType,
      entityId,
      score,
      riskLevel,
      recommendedAction,
      reasonsJson,
    },
    update: {
      score,
      riskLevel,
      recommendedAction,
      reasonsJson,
    },
  });

  await openFraudCaseIfNeeded({ entityType, entityId, riskLevel, score, reasonsJson });
}
