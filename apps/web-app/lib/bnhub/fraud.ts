import { prisma } from "@/lib/db";
import type { FraudSignalType } from "@prisma/client";
import { recordPlatformEvent } from "@/lib/observability";

export type { FraudSignalType };

/**
 * Record a fraud signal (from booking, payment, review, listing, etc.).
 * Call from booking service, payment service, or trust & safety.
 */
export async function createFraudSignal(params: {
  entityType: string;
  entityId: string;
  signalType: FraudSignalType;
  score: number;
  metadata?: Record<string, unknown>;
}) {
  const signal = await prisma.fraudSignal.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      signalType: params.signalType,
      score: Math.max(0, Math.min(1, params.score)),
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });
  void recordPlatformEvent({
    eventType: "fraud_signal",
    entityType: "FRAUD_SIGNAL",
    entityId: signal.id,
    payload: { entityType: params.entityType, entityId: params.entityId, signalType: params.signalType, score: signal.score },
  });
  return signal;
}

/**
 * Get or create a fraud alert for a set of signals. Aggregates risk score.
 * Used when score exceeds threshold or multiple signals for same entity.
 */
export async function getOrCreateFraudAlert(params: {
  signalIds: string[];
  threshold?: number;
}): Promise<{ alert: { id: string; riskScore: number; status: string }; created: boolean }> {
  const signals = await prisma.fraudSignal.findMany({
    where: { id: { in: params.signalIds } },
  });
  if (signals.length === 0)
    throw new Error("No signals found");
  const riskScore = signals.reduce((s, x) => s + x.score, 0) / signals.length;
  const threshold = params.threshold ?? 0.5;
  if (riskScore < threshold) {
    return {
      alert: { id: "", riskScore, status: "BELOW_THRESHOLD" },
      created: false,
    };
  }
  const existing = await prisma.fraudAlert.findFirst({
    where: {
      signalIds: { hasEvery: params.signalIds.slice(0, 1) },
      status: { in: ["NEW", "REVIEWING"] },
    },
  });
  if (existing) return { alert: existing, created: false };
  const alert = await prisma.fraudAlert.create({
    data: {
      signalIds: params.signalIds,
      riskScore,
      status: "NEW",
    },
  });
  return { alert, created: true };
}

/**
 * Queue of fraud alerts for admin / trust & safety.
 */
export async function getFraudAlertsQueue(params: {
  status?: "NEW" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  limit?: number;
}) {
  const where = params.status ? { status: params.status } : {};
  return prisma.fraudAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

/**
 * Update alert status (admin resolution).
 */
export async function updateFraudAlert(
  id: string,
  data: {
    status?: "NEW" | "REVIEWING" | "RESOLVED" | "DISMISSED";
    assignedTo?: string | null;
    notes?: string | null;
    resolvedBy?: string | null;
  }
) {
  return prisma.fraudAlert.update({
    where: { id },
    data: {
      ...data,
      resolvedAt: data.status === "RESOLVED" || data.status === "DISMISSED" ? new Date() : undefined,
      resolvedBy: data.resolvedBy ?? (data.status ? data.resolvedBy : undefined),
    },
  });
}
