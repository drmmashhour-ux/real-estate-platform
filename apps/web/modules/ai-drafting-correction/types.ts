/**
 * AiDraftingCorrectionEngine — types for Turbo Form / LECIPM drafting flows.
 * AI may suggest; it must never bypass notices, Contract Brain, or signature gates.
 */

export type AiDraftLocale = "fr" | "en" | "fr-CA";

export type AiDraftPartyRole = "buyer" | "seller" | "tenant" | "landlord" | "broker" | "admin" | "unknown";

/** Section from Turbo / ProductionGuard draft preview */
export type TurboDraftSection = {
  sectionKey: string;
  title?: string;
  bodyHtml?: string;
  bodyText?: string;
};

/** Normalized Turbo-style draft payload the engine consumes */
export type TurboDraftResult = {
  draftSections: TurboDraftSection[];
  /** User answers / form facts (non-invented; preserved verbatim in outputs) */
  answers?: Record<string, unknown>;
  /** Injected legal notices HTML blocks — must be preserved byte-stable in rewrites */
  noticesHtml?: string[];
  /** Optional raw HTML assembly before section split */
  assembledHtml?: string;
};

export type AiTransactionContext = {
  dealId?: string;
  listingId?: string;
  contractId?: string;
  /** When true, buyer representation notice path should be checked */
  buyerRepresented?: boolean;
  /** Law 25 / personal data */
  personalDataShared?: boolean;
  identityVerified?: boolean;
};

export type AiDraftInput = {
  draftId: string;
  userId: string;
  formKey: string;
  role: AiDraftPartyRole;
  locale: AiDraftLocale;
  draftSections: TurboDraftSection[];
  /** Serialized notices and compliance markers (never stripped by AI) */
  notices?: string[];
  /** Populated after review */
  risks?: AiRiskFinding[];
  answers?: Record<string, unknown>;
  transactionContext?: AiTransactionContext;
  /** Optional full turbo snapshot */
  turboDraft?: TurboDraftResult;
};

export type AiDraftOutput = {
  draftId: string;
  improvedSections: TurboDraftSection[];
  improvedHtml?: string;
  /** Facts explicitly left blank */
  missingFactMarkers: string[];
  findings: AiRiskFinding[];
  turboDraftStatus: TurboDraftAiStatus;
  modelUsed: "deterministic" | "openai" | "none";
  warnings: string[];
};

export type AiCorrectionSeverity = "INFO" | "WARNING" | "CRITICAL";

export type AiRiskFinding = {
  findingKey: string;
  severity: AiCorrectionSeverity;
  sectionKey?: string;
  messageFr: string;
  messageEn: string;
  suggestedFixFr?: string;
  suggestedFixEn?: string;
  blocking: boolean;
};

export type AiCorrectionSuggestion = {
  suggestionKey: string;
  fieldKey?: string;
  messageFr: string;
  messageEn: string;
  actionType: string;
  severity: AiCorrectionSeverity;
};

export type AiRewriteInstruction = "simplify" | "formalize" | "clarify" | "shorten";

export type AiRewriteRequest = {
  draftId: string;
  userId: string;
  sectionKey: string;
  instruction: AiRewriteInstruction;
  /** Current section text or HTML */
  sourceText: string;
  /** Full draft input for notice extraction */
  context: AiDraftInput;
};

export type AiRewriteResult = {
  rewrittenText: string;
  modelUsed: "deterministic" | "openai";
  protectedNoticesRestored: boolean;
  warnings: string[];
};

/** Turbo draft readiness after AI review (orthogonal to Contract Brain / signature gate) */
export type TurboDraftAiStatus = "READY_TO_SIGN" | "NEEDS_REVIEW" | "BLOCKED";

export const AI_DRAFT_RUN_TYPES = {
  INPUT_SNAPSHOT: "draft_input",
  GENERATE: "ai_generate",
  REVIEW: "ai_review",
  REWRITE: "ai_rewrite",
  SUGGESTIONS: "ai_suggestions",
} as const;
