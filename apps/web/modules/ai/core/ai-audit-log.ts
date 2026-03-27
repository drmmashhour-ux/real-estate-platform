import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { summarizeForAudit } from "./ai-guardrails";
import type { AiHub, AiIntent } from "./types";

/** Persist every AI completion for compliance and admin review (`ai_interaction_logs`). */
export async function persistAiInteractionLog(input: {
  userId: string;
  role: string;
  hub: AiHub;
  feature: string;
  intent: AiIntent;
  context: Record<string, unknown>;
  outputText: string;
  source: "openai" | "rules";
  model?: string | null;
  legalContext?: boolean;
}): Promise<string | undefined> {
  const inputSummary = summarizeForAudit(input.context, 4000);
  const outputSummary =
    input.outputText.length > 8000 ? input.outputText.slice(0, 8000) + "…" : input.outputText;
  const legalContext = Boolean(input.legalContext);

  try {
    const row = await prisma.aiInteractionLog.create({
      data: {
        userId: input.userId,
        role: input.role,
        hub: input.hub,
        feature: input.feature,
        intent: input.intent,
        inputSummary,
        outputSummary,
        model: input.model ?? null,
        source: input.source,
        legalContext,
        metadata: { model: input.model ?? null, legalContext },
      },
    });
    return row.id;
  } catch (e) {
    logError("[AiInteractionLog] persist failed", e);
    return undefined;
  }
}

/** Decision Engine evaluations — same table, `feature` = decision_engine. */
export async function persistDecisionEngineLog(input: {
  userId: string;
  role: string;
  hub: AiHub;
  decisionType: string;
  riskLevel: string;
  inputSummary: string;
  outputSummary: string;
}): Promise<string | undefined> {
  try {
    const row = await prisma.aiInteractionLog.create({
      data: {
        userId: input.userId,
        role: input.role,
        hub: input.hub,
        feature: "decision_engine",
        intent: "analyze",
        decisionType: input.decisionType,
        riskLevel: input.riskLevel,
        inputSummary: input.inputSummary,
        outputSummary: input.outputSummary,
        source: "rules",
        metadata: { engine: "decision_v1" },
      },
    });
    return row.id;
  } catch (e) {
    logError("[AiInteractionLog] decision engine persist failed", e);
    return undefined;
  }
}
