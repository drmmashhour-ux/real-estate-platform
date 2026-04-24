import { prisma } from "@/lib/db";
import { anonymizeJsonValue } from "@/modules/ai-memory/anonymize-json";
import { computeDiff } from "@/modules/ai-memory/diffEngine";
import { ingestDiffIntoPatterns } from "@/modules/ai-memory/pattern-extraction";
import { logAiMemory } from "@/modules/ai-memory/ai-memory-logger";

function jsonToTextBlob(j: unknown): string {
  if (typeof j === "string") return j;
  try {
    return JSON.stringify(j);
  } catch {
    return "";
  }
}

export type StoreMemoryExampleParams = {
  draftId: string;
  formKey: string;
  userId?: string | null;
  inputJson: unknown;
  aiOutputJson: unknown;
  finalOutputJson: unknown;
  outcome: string;
};

export async function storeMemoryExample(params: StoreMemoryExampleParams): Promise<{ id: string; diff: ReturnType<typeof computeDiff> }> {
  const inputJson = anonymizeJsonValue(params.inputJson) as object;
  const aiOutputJson = anonymizeJsonValue(params.aiOutputJson) as object;
  const finalOutputJson = anonymizeJsonValue(params.finalOutputJson) as object;

  const diff = computeDiff(jsonToTextBlob(aiOutputJson), jsonToTextBlob(finalOutputJson));

  const row = await prisma.aiMemoryExample.create({
    data: {
      draftId: params.draftId,
      formKey: params.formKey,
      userId: params.userId ?? undefined,
      inputJson,
      aiOutputJson,
      finalOutputJson,
      diffJson: diff as object,
      outcome: params.outcome,
    },
  });

  logAiMemory("ai_memory_saved", {
    id: row.id,
    draftId: params.draftId,
    formKey: params.formKey,
    outcome: params.outcome,
  });

  if (params.outcome === "MODIFIED" || params.outcome === "SUCCESSFUL_DRAFT") {
    await ingestDiffIntoPatterns({ formKey: params.formKey, diff });
  }

  return { id: row.id, diff };
}
