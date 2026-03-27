import type { DeclarationSuggestionResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";
import { retrieveExamplesByField, retrieveGuidanceBySection } from "@/src/modules/seller-declaration-ai/knowledge/declarationKnowledgeRetrievalService";

export function generateSectionSuggestionInputSafe(args: {
  sectionKey: string;
  currentFacts: Record<string, unknown>;
}): DeclarationSuggestionResult {
  const guidance = retrieveGuidanceBySection(args.sectionKey);
  const factEntries = Object.entries(args.currentFacts).filter(([, v]) => String(v ?? "").trim().length > 0);
  const factualLines = factEntries.map(([k, v]) => `${k}: ${String(v)}`);

  const missingFacts: string[] = [];
  if (!factEntries.length) missingFacts.push("No factual notes provided for this section.");
  if (args.sectionKey === "water_damage" && !factEntries.some(([k]) => k.includes("details") || k.includes("date"))) {
    missingFacts.push("Include date/period and affected area.");
  }

  const examples = retrieveExamplesByField(args.sectionKey, factEntries[0]?.[0] ?? "notes");
  const suggestedText = factualLines.length
    ? `Based on provided facts: ${factualLines.join("; ")}. ${guidance[0]?.text ?? "Use neutral, factual wording."}`
    : `${guidance[0]?.text ?? "Provide factual details for this section."}`;

  return {
    sectionKey: args.sectionKey,
    suggestedText,
    assumptions: ["Suggestion is based only on provided draft facts."],
    missingFacts,
    confidence: factEntries.length ? 72 : 42,
  };
}

export function generateFollowUpQuestionsSafe(args: {
  sectionKey: string;
  currentAnswer: string;
  currentDraft: Record<string, unknown>;
}) {
  const questions: string[] = [];
  const answer = args.currentAnswer.toLowerCase();
  const draft = args.currentDraft;

  if (answer.includes("yes") && !answer.includes("detail") && !answer.includes("date")) {
    questions.push("When did this occur?");
    questions.push("Which area was affected?");
    questions.push("Was the issue repaired?");
  }
  if (args.sectionKey === "renovations_repairs" && String(draft.renovations_details ?? "").trim() && !String(draft.renovations_details ?? "").toLowerCase().includes("20")) {
    questions.push("What was the renovation/repair date or period?");
  }
  if (args.sectionKey === "legal_disputes" && String(draft.legal_dispute_flag ?? "") === "true" && !String(draft.legal_dispute_details ?? "").trim()) {
    questions.push("What is the current status of the dispute/claim?");
  }

  return { questions: questions.slice(0, 6) };
}
