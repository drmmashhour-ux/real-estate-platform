/** LECIPM sales script engine — v1 English; copy structured for future i18n. */

export type ScriptAudience = "BROKER" | "INVESTOR";

export type BrokerScriptCategory =
  | "cold_call_broker"
  | "follow_up_broker"
  | "demo_booking_broker"
  | "closing_broker";

export type InvestorScriptCategory =
  | "cold_call_investor"
  | "pitch_investor"
  | "follow_up_investor"
  | "closing_investor";

export type SalesScriptCategory = BrokerScriptCategory | InvestorScriptCategory;

export type ObjectionResponse = {
  when: string;
  line: string;
};

/**
 * Outcome for a single call log (acquisition + sales).
 * Aligned with reporting; not a legal "closed-won" claim.
 */
export type SalesCallOutcome = "INTERESTED" | "DEMO" | "CLOSED" | "LOST" | "NO_ANSWER";

export type SalesScriptVm = {
  id: SalesScriptCategory;
  audience: ScriptAudience;
  title: string;
  opening_line: string;
  hook: string;
  value_proposition: string;
  /** Optional second value block (e.g. investor multi-line pitch). */
  value_secondary?: string;
  pitch_points?: string[];
  discovery_questions: string[];
  objection_handling: ObjectionResponse[];
  closing_line: string;
  fallback_lines: string[];
  /** Optional: one-line compliance note for the rep (no false claims). */
  rep_reminder?: string;
};

export type ScriptContext = {
  contactName?: string;
  /** e.g. montreal, laval, gta */
  region?: string;
  /** top | average | new */
  performanceTier?: "top" | "average" | "new";
  /** last call outcome or stage hook for follow-up */
  previousInteraction?: "none" | "voicemail" | "interested" | "not_now" | "demo_set";
  /** freeform; use for follow-up only, do not fabricate facts */
  lastNote?: string;
  audience: ScriptAudience;
};

export type ScriptVariantKey = "default" | "top_broker" | "junior_broker" | "high_trust_region" | "follow_up_warm";

export type ScriptVariantResult = {
  variantKey: ScriptVariantKey;
  script: SalesScriptVm;
};

export type CallLogInput = {
  contactId?: string | null;
  audience: ScriptAudience;
  scriptCategory: SalesScriptCategory;
  variantKey: string;
  outcome: SalesCallOutcome;
  objectionsEncountered?: string[];
  notes?: string | null;
  performedByUserId?: string | null;
};

export type ScriptConversionStats = {
  byCategory: Record<string, { total: number; byOutcome: Record<string, number> }>;
  topObjections: { label: string; count: number }[];
};
