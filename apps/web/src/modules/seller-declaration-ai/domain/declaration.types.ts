import type { DeclarationActionType, DeclarationDraftStatus } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";

export type DeclarationField = {
  key: string;
  label: string;
  inputType: "text" | "textarea" | "select" | "boolean" | "date";
  required: boolean;
  conditional?: { fieldKey: string; equals: string | boolean };
  helpText: string;
  aiAssistAllowed: boolean;
  options?: string[];
};

export type DeclarationSection = {
  key: string;
  label: string;
  description: string;
  fields: DeclarationField[];
};

export type DeclarationDraftPayload = Record<string, string | boolean | null | undefined>;

export type DeclarationDraft = {
  id: string;
  listingId: string;
  sellerUserId: string | null;
  adminUserId: string | null;
  status: DeclarationDraftStatus;
  draftPayload: DeclarationDraftPayload;
  validationSummary: Record<string, unknown> | null;
  aiSummary: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeclarationSuggestionResult = {
  sectionKey: string;
  suggestedText: string;
  assumptions: string[];
  missingFacts: string[];
  confidence: number;
};

export type KnowledgeRiskHint = {
  content: string;
  sourceTitle: string;
  importance: string;
  pageNumber: number | null;
};

export type DeclarationContentIssue = {
  sectionKey: string;
  fieldKey: string;
  severity: "warning" | "block";
  message: string;
  suggestion: string;
};

export type DeclarationValidationResult = {
  isValid: boolean;
  completenessPercent: number;
  missingFields: string[];
  contradictionFlags: string[];
  warningFlags: string[];
  declarationVariant?: "DS" | "DSD" | null;
  representationMode?: "fsbo" | "broker" | "unknown";
  sectionStatuses: Array<{ sectionKey: string; ready: boolean; missing: string[] }>;
  /** Deterministic platform rules (identity, declaration presence, completeness). */
  knowledgeRuleBlocks: string[];
  knowledgeRuleWarnings: string[];
  /** Retrieval-grounded risk hints from uploaded law/drafting books (never free-form legal advice). */
  knowledgeRiskHints: KnowledgeRiskHint[];
  contentIssues: DeclarationContentIssue[];
};

export type DeclarationAiEventInput = {
  draftId: string;
  sectionKey: string;
  actionType: DeclarationActionType;
  promptContext: Record<string, unknown>;
  output: Record<string, unknown>;
};
