import type {
  SalesCallOutcome,
  SalesScriptCategory,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";

/** High-level flow — human reads and speaks; assistant only suggests. */
export type CallStage = "opening" | "pitch" | "discovery" | "closing" | "objection";

export type CallAssistantContext = {
  audience: ScriptAudience;
  scriptCategory: SalesScriptCategory;
  stage: CallStage;
  /** Index into discovery_questions for discovery stage */
  discoveryIndex?: number;
  /** Prospect’s last words (typed or speech-to-text). Used for objection detection only. */
  lastProspectInput?: string;
  /** Passed through to script generation (name, region, tier, etc.) */
  scriptContext?: ScriptContext;
};

export type NextLineResult = {
  suggested: string;
  alternatives: string[];
  stage: CallStage;
  /** When keyword detection fired */
  objectionLabel?: string;
  /** Compliance / tone reminder */
  reminder?: string;
};

/** Session snapshot for CRM + learning (no auto-dial). */
export type CallSessionSnapshot = {
  startedAt: string;
  endedAt?: string;
  audience: ScriptAudience;
  scriptCategory: SalesScriptCategory;
  stagesVisited: CallStage[];
  secondsInCallApprox: number;
  objectionLabels: string[];
  notes: string;
  outcome: SalesCallOutcome;
  /** Optional line ids or hashes for learning loop */
  suggestionMeta?: { stage: CallStage; usedAlternativeIndex?: number }[];
};
