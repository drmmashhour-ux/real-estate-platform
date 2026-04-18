/**
 * Persist explainable fraud decisions to `fraud_events` (never silent — callers should .catch and log).
 */
import { prisma } from "@/lib/db";
import { asOptionalInputJsonValue } from "@/lib/prisma/as-input-json";
import { fraudTrustV1Flags } from "@/config/feature-flags";

export type LogFraudEventInput = {
  userId?: string | null;
  actionType: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  metadataJson?: Record<string, unknown>;
};

export async function logFraudEvent(input: LogFraudEventInput): Promise<void> {
  if (!fraudTrustV1Flags.fraudDetectionV1 && !fraudTrustV1Flags.launchFraudProtectionV1) {
    return;
  }
  await prisma.fraudEvent.create({
    data: {
      userId: input.userId ?? undefined,
      actionType: input.actionType.slice(0, 64),
      riskScore: Math.max(0, Math.min(100, Math.round(input.riskScore))),
      riskLevel: input.riskLevel.slice(0, 24),
      reasonsJson: input.reasons as unknown as object,
      metadataJson: asOptionalInputJsonValue(input.metadataJson),
    },
  });
}

export async function listRecentFraudEvents(take = 100) {
  return prisma.fraudEvent.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
