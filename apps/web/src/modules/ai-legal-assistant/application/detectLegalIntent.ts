import { LegalAssistantIntent } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.enums";

export function detectLegalIntent(input: string): LegalAssistantIntent {
  const q = input.toLowerCase();
  if (q.includes("compare") && q.includes("version")) return LegalAssistantIntent.COMPARE_VERSIONS;
  if (q.includes("signature") || q.includes("sign")) return LegalAssistantIntent.PREPARE_FOR_SIGNATURE;
  if (q.includes("missing")) return LegalAssistantIntent.IDENTIFY_MISSING_ITEMS;
  if (q.includes("risk") || q.includes("flag")) return LegalAssistantIntent.EXPLAIN_RISK;
  if (q.includes("next") || q.includes("do next")) return LegalAssistantIntent.SUGGEST_NEXT_ACTION;
  if (q.includes("follow") && q.includes("question")) return LegalAssistantIntent.GENERATE_FOLLOWUP_QUESTIONS;
  if (q.includes("comment")) return LegalAssistantIntent.DRAFT_INTERNAL_COMMENT;
  if (q.includes("status")) return LegalAssistantIntent.EXPLAIN_STATUS;
  if (q.includes("summary") || q.includes("summarize")) return LegalAssistantIntent.SUMMARIZE_DOCUMENT;
  if (q.includes("explain")) return LegalAssistantIntent.EXPLAIN_CLAUSE;
  return LegalAssistantIntent.SUGGEST_NEXT_ACTION;
}
