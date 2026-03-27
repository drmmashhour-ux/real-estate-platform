/**
 * AI Control Center – log all AI decisions to ai_logs for monitoring and audit.
 */
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

export type AiLogAction = "evaluate" | "fraud_check" | "price_suggestion" | "trust_score" | "decision";

export type AiLogInput = {
  action: AiLogAction;
  entityType: string;
  entityId: string;
  riskScore?: number | null;
  trustLevel?: string | null;
  trustScore?: number | null;
  recommendedPriceCents?: number | null;
  details?: Record<string, unknown> | null;
};

export async function logAiDecision(input: AiLogInput): Promise<void> {
  const details = input.details as Prisma.InputJsonValue | undefined;
  await prisma.aiLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      riskScore: input.riskScore != null ? Math.round(Math.min(100, Math.max(0, input.riskScore))) : undefined,
      trustLevel: input.trustLevel ?? undefined,
      trustScore: input.trustScore ?? undefined,
      recommendedPriceCents: input.recommendedPriceCents ?? undefined,
      details,
    },
  }).catch((err) => {
    logError("[AiLog] Failed to write ai_logs", err);
  });
}
