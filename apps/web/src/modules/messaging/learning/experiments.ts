import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { AiIntent, AiObjection } from "@/src/modules/messaging/aiClassifier";
import { normDim, type LearningRoutingContext } from "@/src/modules/messaging/learning/contextKey";
import { isTemplateExperimentsEnabled } from "@/src/modules/messaging/learning/learningEnv";

export function isConversationInExperimentBucket(conversationId: string, allocationPercent: number): boolean {
  const pct = Math.min(99, Math.max(1, allocationPercent));
  const h = createHash("sha256").update(conversationId).digest();
  const n = h.readUInt16BE(0) % 100;
  return n < pct;
}

export function chooseExperimentTemplate(
  experiment: { controlTemplateKey: string; variantTemplateKey: string },
  conversationId: string,
  allocationPercent: number
): string {
  return isConversationInExperimentBucket(conversationId, allocationPercent)
    ? experiment.variantTemplateKey
    : experiment.controlTemplateKey;
}

function experimentMatchesRow(
  e: {
    stage: string | null;
    detectedIntent: string | null;
    detectedObjection: string | null;
    highIntent: boolean | null;
  },
  ctx: LearningRoutingContext
): boolean {
  if (e.stage != null && normDim(e.stage) !== normDim(ctx.stage)) return false;
  if (e.detectedIntent != null && normDim(e.detectedIntent) !== normDim(ctx.detectedIntent)) return false;
  if (e.detectedObjection != null && normDim(e.detectedObjection) !== normDim(ctx.detectedObjection)) return false;
  if (e.highIntent != null && e.highIntent !== ctx.highIntent) return false;
  return true;
}

/** Safe flows only: no handoff, no payment/legal paths (caller must skip if handoff). */
export function isExperimentFlowSafe(intent: AiIntent, objection: AiObjection): boolean {
  if (intent === "support_issue" || intent === "unclear") return false;
  if (objection === "price") return false;
  return ["uncertainty", "timing", "none", "trust"].includes(objection);
}

export async function getActiveExperimentForContext(
  ctx: LearningRoutingContext
): Promise<{
  experimentKey: string;
  controlTemplateKey: string;
  variantTemplateKey: string;
  allocationPercent: number;
} | null> {
  if (!isTemplateExperimentsEnabled()) return null;

  const rows = await prisma.growthAiRoutingExperiment.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  const hit = rows.find((e) => experimentMatchesRow(e, ctx));
  if (!hit) return null;

  return {
    experimentKey: hit.experimentKey,
    controlTemplateKey: hit.controlTemplateKey,
    variantTemplateKey: hit.variantTemplateKey,
    allocationPercent: hit.allocationPercent,
  };
}
