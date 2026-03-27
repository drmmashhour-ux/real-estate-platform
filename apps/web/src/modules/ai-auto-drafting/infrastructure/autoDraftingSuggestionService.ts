import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import { getSectionSchema } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingTemplateService";
import { chunksToSourceRefs, retrieveLawContextForSection } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRetrievalService";

function factValue(facts: Record<string, unknown>, key: string): string {
  const v = facts[key];
  if (v === undefined || v === null) return "";
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v).trim();
}

/**
 * Builds draft text only from user-provided facts + neutral framing. No invented material facts.
 */
export async function buildSectionSuggestion(args: {
  templateId: string;
  sectionKey: string;
  documentType: AutoDraftDocumentTypeId;
  facts: Record<string, unknown>;
}): Promise<StandardDraftOutput> {
  const section = getSectionSchema(args.templateId, args.sectionKey);
  if (!section) {
    return {
      documentType: args.documentType,
      sectionKey: args.sectionKey,
      suggestedText: "",
      assumptions: ["Unknown template section — no draft produced."],
      missingFacts: [],
      followUpQuestions: [],
      confidence: 0,
      sourceRefs: [],
    };
  }

  const missingFacts: string[] = [];
  const lines: string[] = [`${section.label}`, ""];

  for (const f of section.fields) {
    if (f.conditional) {
      const condVal = args.facts[f.conditional.fieldKey];
      if (condVal !== f.conditional.equals) continue;
    }
    const val = factValue(args.facts, f.key);
    if (f.required && !val) missingFacts.push(f.label);
    if (!f.aiDraftingEnabled && val) lines.push(`${f.label}: [provided — verify manually]`);
    else if (val) lines.push(`${f.label}: ${val}`);
    else if (!f.required) lines.push(`${f.label}: (not provided)`);
  }

  const retrieval = await retrieveLawContextForSection(section.label, args.sectionKey);
  const sourceRefs = chunksToSourceRefs(retrieval);
  if (retrieval.length) {
    lines.push("", "Reference excerpts (uploaded materials — verify applicability):");
    retrieval.slice(0, 3).forEach((c, i) => {
      lines.push(`${i + 1}. [${c.source.title}] ${c.content.slice(0, 220)}${c.content.length > 220 ? "…" : ""}`);
    });
  }

  const assumptions: string[] = [
    "Draft lines use only values present in structured facts; no new factual claims were added.",
    "Legal interpretation is not performed — reviewer must confirm accuracy.",
  ];
  if (missingFacts.length) assumptions.push("Required fields are incomplete — completion needed before reliance.");

  const confidence = Math.min(0.95, 0.35 + Math.min(5, sourceRefs.length) * 0.08 + (missingFacts.length ? 0 : 0.15));

  return {
    documentType: args.documentType,
    sectionKey: args.sectionKey,
    suggestedText: lines.join("\n").trim(),
    assumptions,
    missingFacts,
    followUpQuestions: missingFacts.map((m) => `Please provide: ${m}`),
    confidence,
    sourceRefs,
  };
}
