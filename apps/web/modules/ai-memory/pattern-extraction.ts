import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { ClauseDiffResult } from "@/modules/ai-memory/diffEngine";
import { logAiMemory } from "@/modules/ai-memory/ai-memory-logger";

const MIN_LEN = 24;
export const PATTERN_THRESHOLD = 3;

function normalizeForKey(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 8000);
}

export function makePatternKey(findingKey: string, original: string, corrected: string): string {
  const h = createHash("sha256");
  h.update(`${findingKey}|${normalizeForKey(original)}|${normalizeForKey(corrected)}`);
  return h.digest("hex");
}

export function inferFindingKey(from: string, to: string): string {
  const blob = `${from} ${to}`.toLowerCase();
  if (/garantie|warranty|exclu/.test(blob)) return "WARRANTY_EXCLUSION_UNCLEAR";
  if (/borne|recharge|ev\b/.test(blob)) return "EV_CHARGER_AMBIGUITY";
  if (/financement|délai/.test(blob)) return "FINANCING_DELAY";
  if (/représent|oaciq|rôle limité/.test(blob)) return "REPRESENTATION_NOTICE";
  if (/loi\s*25|renseignements personnels/.test(blob)) return "LAW25_CONSENT";
  return "CLAUSE_REWRITE";
}

/**
 * Upsert correction patterns from a diff. Logs when frequency crosses PATTERN_THRESHOLD.
 */
export async function ingestDiffIntoPatterns(params: {
  formKey: string | null;
  diff: ClauseDiffResult;
}): Promise<void> {
  for (const { from, to } of params.diff.rewritten) {
    if (from.length < MIN_LEN || to.length < MIN_LEN) continue;
    if (from === to) continue;
    const findingKey = inferFindingKey(from, to);
    const patternKey = makePatternKey(findingKey, from, to);

    const beforeRow = await prisma.aiCorrectionPattern.findUnique({ where: { patternKey } });
    const prevFreq = beforeRow?.frequency ?? 0;

    await prisma.aiCorrectionPattern.upsert({
      where: { patternKey },
      create: {
        formKey: params.formKey,
        findingKey,
        patternKey,
        originalText: from.slice(0, 12000),
        correctedText: to.slice(0, 12000),
        frequency: 1,
      },
      update: {
        frequency: { increment: 1 },
        ...(params.formKey ? { formKey: params.formKey } : {}),
      },
    });

    const afterRow = await prisma.aiCorrectionPattern.findUnique({ where: { patternKey } });
    const afterFreq = afterRow?.frequency ?? prevFreq;

    if (prevFreq < PATTERN_THRESHOLD && afterFreq >= PATTERN_THRESHOLD) {
      logAiMemory("ai_pattern_created", { patternKey, findingKey, frequency: afterFreq, formKey: params.formKey });
    }
  }
}

/** Manual / API ingest of a single broker correction (increments same counter as diff pipeline). */
export async function recordManualPattern(params: {
  formKey: string | null;
  findingKey: string;
  originalText: string;
  correctedText: string;
}): Promise<{ patternKey: string; frequency: number }> {
  const patternKey = makePatternKey(params.findingKey, params.originalText, params.correctedText);
  const beforeRow = await prisma.aiCorrectionPattern.findUnique({ where: { patternKey } });
  const prevFreq = beforeRow?.frequency ?? 0;

  await prisma.aiCorrectionPattern.upsert({
    where: { patternKey },
    create: {
      formKey: params.formKey,
      findingKey: params.findingKey,
      patternKey,
      originalText: params.originalText.slice(0, 12000),
      correctedText: params.correctedText.slice(0, 12000),
      frequency: 1,
    },
    update: {
      frequency: { increment: 1 },
      ...(params.formKey ? { formKey: params.formKey } : {}),
    },
  });

  const afterRow = await prisma.aiCorrectionPattern.findUnique({ where: { patternKey } });
  const afterFreq = afterRow?.frequency ?? prevFreq + 1;

  if (prevFreq < PATTERN_THRESHOLD && afterFreq >= PATTERN_THRESHOLD) {
    logAiMemory("ai_pattern_created", {
      patternKey,
      findingKey: params.findingKey,
      frequency: afterFreq,
      formKey: params.formKey,
      source: "manual",
    });
  }

  return { patternKey, frequency: afterFreq };
}
