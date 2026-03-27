import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { retrieveDraftingContext, chunksToSourceRefs } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRetrievalService";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

/**
 * Clause scaffold from facts + retrieval wording patterns only — never a final legal instrument.
 */
export async function generateClauseDraft(args: {
  documentType: AutoDraftDocumentTypeId;
  sectionKey: string;
  topic: string;
  facts: Record<string, unknown>;
}) {
  const factLines = Object.entries(args.facts)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}`);

  const chunks = await retrieveDraftingContext(`${args.topic} clause brokerage`, { audience: "broker", limit: 5 });
  const sourceRefs = chunksToSourceRefs(chunks);

  const suggestedText = [
    `Clause topic: ${args.topic}`,
    "",
    "Structured facts (user-supplied only):",
    ...factLines.map((l) => `- ${l}`),
    "",
    "Non-binding structural scaffold (review with counsel):",
    `The parties acknowledge the matters described under ${args.sectionKey} as stated in the facts above. This scaffold does not add facts.`,
    "",
    "Retrieved drafting patterns (verify against your jurisdiction):",
    ...chunks.slice(0, 2).map((c, i) => `${i + 1}. [${c.source.title}] ${c.content.slice(0, 180)}…`),
  ].join("\n");

  const out: StandardDraftOutput = {
    documentType: args.documentType,
    sectionKey: args.sectionKey,
    suggestedText,
    assumptions: ["No new factual assertions beyond the structured facts object.", "Clause is preparatory — not executed or binding."],
    missingFacts: factLines.length ? [] : ["No structured facts supplied for clause generation."],
    followUpQuestions: factLines.length ? [] : ["Provide structured field values before relying on this scaffold."],
    confidence: Math.min(0.85, 0.4 + sourceRefs.length * 0.08),
    sourceRefs,
  };
  return out;
}
