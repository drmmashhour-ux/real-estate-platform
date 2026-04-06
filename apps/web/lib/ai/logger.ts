import { prisma } from "@/lib/db";
import { logAiEvent } from "@/lib/ai/log";
import type { AgentKey, DecisionMode } from "./types";
import { normalizeConfidence } from "./confidence";

/** Legacy AI pipeline audit hook — structured console + event stream (non-blocking). */
export type AiLogAction = string;

export type AiLogInput = {
  action: string;
  entityType?: string;
  entityId?: string;
  riskScore?: number;
  trustScore?: number;
  trustLevel?: string;
  /** Pricing audit (stored inside structured log payload). */
  recommendedPriceCents?: number;
  details?: Record<string, unknown>;
};

export async function logAiDecision(input: AiLogInput): Promise<void> {
  try {
    logAiEvent("analysis_run", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      riskScore: input.riskScore,
      trustScore: input.trustScore,
      trustLevel: input.trustLevel,
      ...(input.recommendedPriceCents != null ? { recommendedPriceCents: input.recommendedPriceCents } : {}),
      ...(input.details ?? {}),
    });
  } catch {
    // non-fatal
  }
}

export async function logManagerAgentRun(input: {
  userId?: string | null;
  actorUserId?: string | null;
  agentKey: AgentKey;
  decisionMode: DecisionMode;
  inputSummary: string;
  outputSummary?: string | null;
  confidence?: number | null;
  status?: string;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: Record<string, unknown>;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
}) {
  try {
    await prisma.managerAiAgentRun.create({
      data: {
        userId: input.userId ?? undefined,
        actorUserId: input.actorUserId ?? input.userId ?? undefined,
        agentKey: input.agentKey,
        decisionMode: input.decisionMode,
        inputSummary: input.inputSummary.slice(0, 8000),
        outputSummary: input.outputSummary?.slice(0, 8000) ?? undefined,
        confidence: input.confidence != null ? normalizeConfidence(input.confidence) : undefined,
        status: input.status ?? "completed",
        payload: input.payload as object | undefined,
        result: input.result as object | undefined,
        error: input.error as object | undefined,
        targetEntityType: input.targetEntityType ?? undefined,
        targetEntityId: input.targetEntityId ?? undefined,
      },
    });
  } catch {
    // non-fatal
  }
  logAiEvent("lecipm_manager_run", {
    agentKey: input.agentKey,
    decisionMode: input.decisionMode,
    status: input.status,
  });
}

export async function logManagerAction(input: {
  userId: string | null;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  status: string;
  decisionMode?: DecisionMode;
  confidence?: number | null;
  decisionScore?: number | null;
  suppressionReason?: string | null;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: Record<string, unknown>;
  approvalId?: string | null;
}) {
  try {
    await prisma.managerAiActionLog.create({
      data: {
        userId: input.userId ?? undefined,
        actionKey: input.actionKey,
        targetEntityType: input.targetEntityType,
        targetEntityId: input.targetEntityId,
        status: input.status,
        decisionMode: input.decisionMode,
        confidence: input.confidence != null ? normalizeConfidence(input.confidence) : undefined,
        decisionScore:
          input.decisionScore != null && Number.isFinite(input.decisionScore)
            ? Math.min(1, Math.max(0, input.decisionScore))
            : undefined,
        suppressionReason: input.suppressionReason ?? undefined,
        payload: input.payload as object | undefined,
        result: input.result as object | undefined,
        error: input.error as object | undefined,
        approvalId: input.approvalId ?? undefined,
      },
    });
  } catch {
    // non-fatal
  }
  logAiEvent("lecipm_manager_action", {
    actionKey: input.actionKey,
    targetEntityType: input.targetEntityType,
    status: input.status,
  });
}
