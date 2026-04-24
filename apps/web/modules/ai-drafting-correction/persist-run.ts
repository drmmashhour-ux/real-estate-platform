import { prisma } from "@/lib/db";
import type { AiCorrectionSuggestion, AiDraftInput, AiDraftOutput, AiRiskFinding } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";

export async function persistAiDraftRun(params: {
  draftId: string;
  userId: string;
  runType: string;
  input?: unknown;
  output?: unknown;
}): Promise<void> {
  await prisma.aiDraftRun.create({
    data: {
      draftId: params.draftId,
      userId: params.userId,
      runType: params.runType,
      status: "COMPLETED",
      inputJson: params.input ? (params.input as object) : undefined,
      outputJson: params.output ? (params.output as object) : undefined,
    },
  });
}

export async function persistFindings(draftId: string, userId: string, findings: AiRiskFinding[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.aiDraftFinding.updateMany({
      where: { draftId, userId, resolved: false },
      data: { resolved: true, resolvedAt: new Date() },
    });
    if (!findings.length) return;
    await tx.aiDraftFinding.createMany({
      data: findings.map((f) => ({
        draftId,
        userId,
        findingKey: f.findingKey,
        severity: f.severity,
        sectionKey: f.sectionKey ?? null,
        messageFr: f.messageFr,
        messageEn: f.messageEn,
        suggestedFixFr: f.suggestedFixFr ?? null,
        suggestedFixEn: f.suggestedFixEn ?? null,
        blocking: f.blocking,
      })),
    });
  });
}

export async function persistSuggestions(
  draftId: string,
  userId: string,
  suggestions: AiCorrectionSuggestion[]
): Promise<void> {
  await prisma.aiDraftSuggestion.deleteMany({ where: { draftId, userId, applied: false } }).catch(() => undefined);
  if (!suggestions.length) return;
  await prisma.aiDraftSuggestion.createMany({
    data: suggestions.map((s) => ({
      draftId,
      userId,
      fieldKey: s.fieldKey ?? null,
      suggestionFr: s.messageFr,
      suggestionEn: s.messageEn,
      actionType: s.actionType,
    })),
  });
}

export async function resolveDraftInput(
  draftId: string,
  userId: string,
  bodyInput: AiDraftInput | undefined,
  loadLatest: () => Promise<AiDraftInput | null>
): Promise<AiDraftInput | null> {
  if (bodyInput && bodyInput.draftId === draftId && bodyInput.userId === userId) {
    return bodyInput;
  }
  return loadLatest();
}

export function outputToJson(out: AiDraftOutput): object {
  return {
    improvedSections: out.improvedSections,
    improvedHtml: out.improvedHtml,
    missingFactMarkers: out.missingFactMarkers,
    turboDraftStatus: out.turboDraftStatus,
    modelUsed: out.modelUsed,
    warnings: out.warnings,
    findingKeys: out.findings.map((f) => f.findingKey),
  };
}
