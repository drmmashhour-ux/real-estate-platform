import "server-only";

import { prisma } from "@/lib/db";
import { logAiDecision as logModelKeyedDecision } from "@/lib/ai-decision-log";

type ModelKeyedDecisionParams = Parameters<typeof logModelKeyedDecision>[0];

type ManagerLogPayload = {
  userId?: string | null;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  status?: string;
  payload?: Record<string, unknown>;
  approvalId?: string;
  error?: unknown;
};

/** Persists manager/host AI action logs (approval flows, autopilot, etc.). */
export async function logManagerAction(params: ManagerLogPayload) {
  return prisma.managerAiActionLog.create({
    data: {
      userId: params.userId ?? undefined,
      actionKey: params.actionKey,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      status: params.status ?? "executed",
      payload: params.payload ?? undefined,
      approvalId: params.approvalId ?? undefined,
      error: params.error as object | undefined,
    },
  });
}

type LooseAiDecisionPayload = {
  action: string;
  modelKey?: never;
  entityType?: string;
  entityId?: string;
  riskScore?: number;
  trustLevel?: string;
  recommendedPriceCents?: number;
  details?: unknown;
};

/**
 * AI decision audit — either the model-keyed `AiDecisionLog` path or a generic `ManagerAiActionLog` row
 * for routes that pass `action` + entity hints (price suggestion, fraud stub, etc.).
 */
export async function logAiDecision(payload: ModelKeyedDecisionParams | LooseAiDecisionPayload) {
  if ("modelKey" in payload && typeof payload.modelKey === "string" && payload.modelKey.length > 0) {
    return logModelKeyedDecision(payload as ModelKeyedDecisionParams);
  }

  const p = payload as LooseAiDecisionPayload;
  const targetType = p.entityType ?? "unknown";
  const targetId = p.entityId ?? "unknown";
  return prisma.managerAiActionLog.create({
    data: {
      userId: undefined,
      actionKey: p.action,
      targetEntityType: targetType,
      targetEntityId: targetId,
      status: "executed",
      payload: {
        source: "logAiDecision",
        ...p,
      },
    },
  });
}
