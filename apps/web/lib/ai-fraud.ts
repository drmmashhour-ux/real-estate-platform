/**
 * Fraud Detection AI – aggregate signals into risk scores, priority, automated flags.
 * Connects to trust & safety, booking approval, payout controls.
 */
import { prisma } from "@/lib/db";
import { createFraudSignal } from "@/lib/bnhub/fraud";
import type { FraudSignalType } from "@prisma/client";

const FRAUD_MODEL_VERSION = "fraud_v1";

/** Compute fraud risk score from inline signals (e.g. API body). */
export function computeFraudScoreFromSignals(signals: { type: string; score: number }[]): {
  score: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  factors: Record<string, number>;
} {
  const typeWeight: Record<string, number> = {
    PAYMENT_FRAUD: 1.2,
    ACCOUNT_TAKEOVER: 1.2,
    FAKE_LISTING: 1.0,
    SUSPICIOUS_BOOKING: 1.0,
    REFUND_ABUSE: 1.1,
    REVIEW_MANIPULATION: 0.9,
    SUSPICIOUS_MESSAGING: 0.8,
  };
  const factors: Record<string, number> = {};
  let weightedSum = 0;
  let weightTotal = 0;
  for (const s of signals) {
    const w = typeWeight[s.type] ?? 1;
    weightedSum += s.score * w;
    weightTotal += w;
    factors[s.type] = (factors[s.type] ?? 0) + s.score;
  }
  const score = signals.length === 0 ? 0 : Math.min(1, weightedSum / weightTotal);
  const priority: "HIGH" | "MEDIUM" | "LOW" =
    score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
  return { score, priority, factors };
}

/** Compute fraud risk score for an entity from existing signals and optional live signals. */
export async function computeFraudScore(params: {
  entityType: string;
  entityId: string;
  signalIds?: string[];
}): Promise<{ score: number; priority: "HIGH" | "MEDIUM" | "LOW"; factors: Record<string, number> }> {
  const signals = params.signalIds?.length
    ? await prisma.fraudSignal.findMany({
        where: { id: { in: params.signalIds } },
      })
    : await prisma.fraudSignal.findMany({
        where: { entityType: params.entityType, entityId: params.entityId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

  const factors: Record<string, number> = {};
  let weightedSum = 0;
  let weightTotal = 0;
  const typeWeight: Record<string, number> = {
    PAYMENT_FRAUD: 1.2,
    ACCOUNT_TAKEOVER: 1.2,
    FAKE_LISTING: 1.0,
    SUSPICIOUS_BOOKING: 1.0,
    REFUND_ABUSE: 1.1,
    REVIEW_MANIPULATION: 0.9,
    SUSPICIOUS_MESSAGING: 0.8,
  };
  for (const s of signals) {
    const w = typeWeight[s.signalType] ?? 1;
    weightedSum += s.score * w;
    weightTotal += w;
    factors[s.signalType] = (factors[s.signalType] ?? 0) + s.score;
  }
  const score = signals.length === 0 ? 0 : Math.min(1, weightedSum / weightTotal);
  const priority: "HIGH" | "MEDIUM" | "LOW" =
    score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

  return { score, priority, factors };
}

/** Compute and persist fraud score; create FraudScore record and optionally AiDecisionLog. */
export async function evaluateAndStoreFraudScore(params: {
  entityType: string;
  entityId: string;
  signalIds?: string[];
  logDecision?: boolean;
}) {
  const { score, priority, factors } = await computeFraudScore({
    entityType: params.entityType,
    entityId: params.entityId,
    signalIds: params.signalIds,
  });

  const existing = await prisma.fraudScore.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    await prisma.fraudScore.update({
      where: { id: existing.id },
      data: {
        score,
        factors: factors as object,
        modelVersion: FRAUD_MODEL_VERSION,
        priority,
      },
    });
  } else {
    await prisma.fraudScore.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        score,
        factors: factors as object,
        modelVersion: FRAUD_MODEL_VERSION,
        priority,
      },
    });
  }

  const model = await prisma.aiModel.findUnique({ where: { key: "fraud" } });
  if (params.logDecision && model) {
    await prisma.aiDecisionLog.create({
      data: {
        modelId: model.id,
        modelVersion: FRAUD_MODEL_VERSION,
        entityType: params.entityType,
        entityId: params.entityId,
        decision: score >= 0.7 ? "FLAG" : score >= 0.4 ? "FLAG" : "ALLOW",
        score,
        explanation: `Priority: ${priority}. Factors: ${JSON.stringify(factors)}`,
        context: { factors },
      },
    });
  }

  return { score, priority, factors };
}

/** Get current fraud score for entity. */
export async function getFraudScore(entityType: string, entityId: string) {
  return prisma.fraudScore.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
}

/** Record a fraud signal and optionally re-run fraud score (e.g. on booking). */
export async function recordFraudSignalAndScore(params: {
  entityType: string;
  entityId: string;
  signalType: FraudSignalType;
  score: number;
  metadata?: Record<string, unknown>;
}) {
  const signal = await createFraudSignal({
    entityType: params.entityType,
    entityId: params.entityId,
    signalType: params.signalType,
    score: params.score,
    metadata: params.metadata,
  });
  await evaluateAndStoreFraudScore({
    entityType: params.entityType,
    entityId: params.entityId,
    signalIds: [signal.id],
    logDecision: true,
  });
  return signal;
}
