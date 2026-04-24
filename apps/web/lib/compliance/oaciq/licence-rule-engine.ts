import type { OaciqRuleEngineBundle } from "@/lib/compliance/oaciq/rule-engine.types";

/**
 * Static rule bundle aligned with OACIQ “licence issue and maintenance” obligations for LECIPM.
 * Context keys are populated by `buildOaciqLicenceContext` in `broker-licence-service.ts`.
 */
export const LECIPM_LICENCE_RULE_ENGINE: OaciqRuleEngineBundle = {
  requiredActions: [
    "verify_broker_identity",
    "verify_oaciq_licence_status",
    "verify_licence_category",
    "attach_broker_to_every_transaction",
  ],
  forbiddenActions: [
    "allow_unlicensed_user_to_act_as_broker",
    "allow_ai_to_execute_legal_actions",
    "allow_out_of_scope_transaction",
  ],
  /**
   * Mirrors playbook conditional gates — context keys come from `buildOaciqLicenceContext`.
   * When licence compound flag is false, require explicit supervisory acknowledgement (broker UI).
   */
  conditionalChecks: [
    {
      id: "licence_not_compound_active",
      when: { field: "is_licence_active", equals: false },
      thenRequire: ["manual_regulator_review_completed"],
    },
    {
      id: "scope_not_residential",
      when: { field: "is_residential_scope_valid", equals: false },
      thenRequire: ["manual_regulator_review_completed"],
    },
  ],
};

/** AI-facing copy — assistant only; broker remains liable. */
export const LECIPM_LICENCE_AI_BEHAVIOR = {
  AI_CHECKLIST: [
    "Is your OACIQ licence active and in good standing?",
    "Is this property residential (fewer than five dwellings) or otherwise within your residential category?",
    "Are you personally acting as broker on this file (not the platform or AI)?",
    "Is this mandate within your legal scope as a residential broker?",
  ],
  AI_WARNINGS: [
    "⚠️ Licence verification required — confirm OACIQ status before brokerage steps.",
    "⚠️ This transaction may exceed a residential licence scope — seek guidance if unsure.",
    "⚠️ Brokerage activity for remuneration requires a valid OACIQ licence.",
  ],
  AI_BLOCKS: [
    "BLOCK when the broker licence is not verified active on the platform.",
    "BLOCK when the deal type appears commercial or outside residential scope.",
    "BLOCK when no broker is assigned to the transaction.",
  ],
} as const;
