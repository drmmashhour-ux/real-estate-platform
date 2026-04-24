import type { LecipmDisputeCaseCategory, Prisma } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/db";

import { logPatternLearning } from "./dispute-prediction-log";
import type { RiskSignal } from "@/modules/risk-engine/risk.types";

export type PatternFingerprint = {
  signalKeys: string[];
};

/**
 * Lightweight correlation pass over recent disputes vs prior risk snapshots — **not** a certified ML model.
 */
export async function trainDisputePatternsFromHistory(opts?: {
  windowDays?: number;
  maxDisputes?: number;
}): Promise<{ patternsUpserted: number }> {
  const windowDays = opts?.windowDays ?? 180;
  const maxDisputes = opts?.maxDisputes ?? 150;
  const since = subDays(new Date(), windowDays);

  const disputes = await prisma.lecipmDisputeCase.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: maxDisputes,
    select: {
      relatedEntityType: true,
      relatedEntityId: true,
      category: true,
      createdAt: true,
    },
  });

  /** patternKey -> { hits, categoryCounts } */
  const acc = new Map<
    string,
    { hits: number; categoryCounts: Record<string, number>; sampleSignals: Set<string> }
  >();

  for (const d of disputes) {
    const snap = await prisma.lecipmPreDisputeRiskAssessment.findFirst({
      where: {
        subjectType: d.relatedEntityType,
        subjectId: d.relatedEntityId,
        createdAt: { lte: d.createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { signalsJson: true },
    });
    if (!snap?.signalsJson) continue;

    const signals = snap.signalsJson as unknown as RiskSignal[];
    const keys = [...new Set(signals.map((s) => s.id))].sort();
    if (keys.length === 0) continue;

    const pairKey = keys.slice(0, 4).join("+");
    const patternKey = `sig_cluster:${pairKey}->${d.category}`.slice(0, 190);
    const row = acc.get(patternKey) ?? {
      hits: 0,
      categoryCounts: {},
      sampleSignals: new Set<string>(),
    };
    row.hits += 1;
    row.categoryCounts[d.category] = (row.categoryCounts[d.category] ?? 0) + 1;
    keys.forEach((k) => row.sampleSignals.add(k));
    acc.set(patternKey, row);
  }

  let patternsUpserted = 0;
  const trainedAt = new Date();

  for (const [patternKey, v] of acc.entries()) {
    const topCat = pickTopCategory(v.categoryCounts) ?? "OTHER";
    const confidence = Math.min(0.92, 0.35 + v.hits / (maxDisputes + 20));
    const impactScore = Math.min(100, v.hits * 6);

    const fingerprint: PatternFingerprint = {
      signalKeys: [...v.sampleSignals].slice(0, 12),
    };

    await prisma.lecipmDisputePredictionPattern.upsert({
      where: { patternKey },
      create: {
        patternKey,
        confidence,
        impactScore,
        sampleSize: v.hits,
        signalsFingerprintJson: fingerprint as unknown as Prisma.InputJsonValue,
        recommendedPreventionJson: {
          hints: [
            "Increase neutral confirmation prompts for this signal cluster.",
            "Add assistive checklist for documentation and timing clarity.",
          ],
        } as unknown as Prisma.InputJsonValue,
        topOutcomeCategory: topCat as LecipmDisputeCaseCategory,
        lastTrainedAt: trainedAt,
      },
      update: {
        confidence,
        impactScore,
        sampleSize: v.hits,
        signalsFingerprintJson: fingerprint as unknown as Prisma.InputJsonValue,
        topOutcomeCategory: topCat as LecipmDisputeCaseCategory,
        lastTrainedAt: trainedAt,
      },
    });
    patternsUpserted += 1;
  }

  logPatternLearning("train_complete", { patternsUpserted, disputesSampled: disputes.length });
  return { patternsUpserted };
}

function pickTopCategory(counts: Record<string, number>): LecipmDisputeCaseCategory | null {
  let best: LecipmDisputeCaseCategory | null = null;
  let mx = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > mx) {
      mx = v;
      best = k as LecipmDisputeCaseCategory;
    }
  }
  return best;
}
