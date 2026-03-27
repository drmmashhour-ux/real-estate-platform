import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { retrieveLawContextForSection, chunksToSourceRefs } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRetrievalService";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

const SOFT_WORDS = /\b(probably|maybe|i think|i believe|obviously|clearly)\b/gi;

/**
 * Neutral tone cleanup only — does not add facts or legal conclusions.
 */
export async function rewriteDraftNotes(args: {
  documentType: AutoDraftDocumentTypeId;
  sectionKey: string;
  rawNotes: string;
}) {
  const cleaned = args.rawNotes.replace(SOFT_WORDS, "").replace(/\s+/g, " ").trim();
  const chunks = await retrieveLawContextForSection("neutral factual disclosure", args.sectionKey);
  const sourceRefs = chunksToSourceRefs(chunks.slice(0, 3));

  const suggestedText = cleaned.length
    ? `Factual notes (neutral tone, same content as provided; hedging language removed where detected):\n\n${cleaned}`
    : "";

  const out: StandardDraftOutput = {
    documentType: args.documentType,
    sectionKey: args.sectionKey,
    suggestedText,
    assumptions: ["No new facts introduced; only stylistic neutralization.", "Reviewer must verify completeness."],
    missingFacts: cleaned.length ? [] : ["No notes supplied to rewrite."],
    followUpQuestions: cleaned.length ? [] : ["Paste rough notes to neutralize."],
    confidence: cleaned.length ? 0.55 : 0,
    sourceRefs,
  };
  return out;
}
