import { prisma } from "@/lib/db";
import { logAiMemory } from "@/modules/ai-memory/ai-memory-logger";

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

/**
 * Load high-frequency broker-learned patterns for a form. Injected AFTER compliance rules in the prompt.
 */
export async function buildMemoryPromptBlockForFormKey(formKey: string, limit = 8): Promise<string> {
  const patterns = await prisma.aiCorrectionPattern.findMany({
    where: {
      OR: [{ formKey }, { formKey: null }],
      frequency: { gte: 3 },
    },
    orderBy: [{ frequency: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  if (!patterns.length) return "";

  logAiMemory("ai_pattern_applied", { formKey, patternCount: patterns.length });

  return patterns
    .map(
      (p) =>
        `- [${p.findingKey}] Fréquent (${p.frequency}×): reformuler « ${clip(p.originalText, 160)} » vers « ${clip(p.correctedText, 160)} »`
    )
    .join("\n");
}

export function mergeComplianceThenMemoryThenModel(complianceBlock: string, memoryBlock: string, modelInstructions: string): string {
  return `${complianceBlock}\n\n---\nLearned patterns (secondary — never contradict compliance above):\n${memoryBlock}\n\n---\n${modelInstructions}`;
}
