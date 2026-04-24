import { prisma } from "@/lib/db";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";

export async function persistDraftInputSnapshot(input: AiDraftInput): Promise<void> {
  await prisma.aiDraftRun.create({
    data: {
      draftId: input.draftId,
      userId: input.userId,
      runType: AI_DRAFT_RUN_TYPES.INPUT_SNAPSHOT,
      status: "COMPLETED",
      inputJson: input as object,
    },
  });
}

export async function loadLatestDraftInput(draftId: string, userId: string): Promise<AiDraftInput | null> {
  const row = await prisma.aiDraftRun.findFirst({
    where: { draftId, userId, runType: AI_DRAFT_RUN_TYPES.INPUT_SNAPSHOT },
    orderBy: { createdAt: "desc" },
  });
  if (!row?.inputJson || typeof row.inputJson !== "object") return null;
  return row.inputJson as AiDraftInput;
}

export async function mergePartialInput(
  draftId: string,
  userId: string,
  partial: Partial<AiDraftInput>
): Promise<AiDraftInput | null> {
  const base = await loadLatestDraftInput(draftId, userId);
  if (!base) return null;
  return {
    ...base,
    ...partial,
    draftId,
    userId,
    draftSections: partial.draftSections ?? base.draftSections,
    answers: partial.answers ?? base.answers,
    notices: partial.notices ?? base.notices,
    transactionContext: { ...base.transactionContext, ...partial.transactionContext },
  };
}
