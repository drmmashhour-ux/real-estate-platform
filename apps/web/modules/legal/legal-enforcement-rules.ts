/**
 * Static enforcement catalog — deterministic, editable in code review (no runtime mutation).
 * Soft = advisory only; Hard = deterministic block until resolved (still never auto-approved).
 */

import type { LegalGateAction, LegalEnforcementMode } from "./legal-readiness.types";
import type { LegalHubActorType, LegalWorkflowType } from "./legal.types";

export type LegalGateRequirementRule = {
  workflowType: LegalWorkflowType;
  requirementId: string;
  /** Enforce mode for this tuple; `none` skips (unused in rows — prefer omitting rows). */
  mode: Exclude<LegalEnforcementMode, "none">;
  actors: LegalHubActorType[];
};

/** Rules applied when the actor matches; multiple rows per action are additive. */
export const LEGAL_ENFORCEMENT_RULES: Record<LegalGateAction, LegalGateRequirementRule[]> = {
  publish_listing: [
    {
      workflowType: "seller_disclosure",
      requirementId: "accuracy_ack",
      mode: "hard",
      actors: ["seller"],
    },
    {
      workflowType: "seller_disclosure",
      requirementId: "verification_gate",
      mode: "soft",
      actors: ["seller"],
    },
    {
      workflowType: "identity_verification",
      requirementId: "submit_id",
      mode: "soft",
      actors: ["seller"],
    },
    {
      workflowType: "short_term_rental_compliance",
      requirementId: "host_terms",
      mode: "hard",
      actors: ["host"],
    },
    {
      workflowType: "identity_verification",
      requirementId: "submit_id",
      mode: "soft",
      actors: ["host"],
    },
    {
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
      mode: "soft",
      actors: ["host", "seller"],
    },
  ],

  activate_host_listing: [
    {
      workflowType: "short_term_rental_compliance",
      requirementId: "host_terms",
      mode: "hard",
      actors: ["host"],
    },
    {
      workflowType: "short_term_rental_compliance",
      requirementId: "identity_host",
      mode: "soft",
      actors: ["host"],
    },
    {
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
      mode: "soft",
      actors: ["host"],
    },
  ],

  start_booking: [
    {
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
      mode: "hard",
      actors: ["buyer"],
    },
    {
      workflowType: "risk_acknowledgement",
      requirementId: "platform_ack",
      mode: "soft",
      actors: ["buyer"],
    },
    {
      workflowType: "short_term_rental_compliance",
      requirementId: "identity_host",
      mode: "soft",
      actors: ["host"],
    },
  ],

  complete_booking: [
    {
      workflowType: "risk_acknowledgement",
      requirementId: "platform_ack",
      mode: "soft",
      actors: ["buyer"],
    },
    {
      workflowType: "payment_terms",
      requirementId: "terms_service",
      mode: "soft",
      actors: ["buyer"],
    },
  ],

  submit_offer: [
    {
      workflowType: "purchase_offer",
      requirementId: "identity_ready",
      mode: "hard",
      actors: ["buyer"],
    },
    {
      workflowType: "purchase_offer",
      requirementId: "terms_payment",
      mode: "hard",
      actors: ["buyer"],
    },
    {
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
      mode: "soft",
      actors: ["buyer"],
    },
  ],

  accept_offer: [
    {
      workflowType: "seller_disclosure",
      requirementId: "accuracy_ack",
      mode: "hard",
      actors: ["seller"],
    },
    {
      workflowType: "seller_disclosure",
      requirementId: "material_updates",
      mode: "soft",
      actors: ["seller"],
    },
    {
      workflowType: "purchase_offer",
      requirementId: "identity_ready",
      mode: "soft",
      actors: ["buyer"],
    },
    {
      workflowType: "purchase_offer",
      requirementId: "terms_payment",
      mode: "soft",
      actors: ["buyer"],
    },
    {
      workflowType: "purchase_offer",
      requirementId: "broker_coordination",
      mode: "soft",
      actors: ["broker"],
    },
  ],

  unlock_contact: [
    {
      workflowType: "broker_mandate",
      requirementId: "license_verification",
      mode: "hard",
      actors: ["broker"],
    },
    {
      workflowType: "broker_mandate",
      requirementId: "broker_agreement",
      mode: "soft",
      actors: ["broker"],
    },
    {
      workflowType: "privacy_consent",
      requirementId: "privacy_policy",
      mode: "soft",
      actors: ["broker"],
    },
  ],

  become_broker: [
    {
      workflowType: "broker_mandate",
      requirementId: "broker_agreement",
      mode: "hard",
      actors: ["broker"],
    },
    {
      workflowType: "broker_mandate",
      requirementId: "license_verification",
      mode: "hard",
      actors: ["broker"],
    },
    {
      workflowType: "identity_verification",
      requirementId: "submit_id",
      mode: "soft",
      actors: ["broker"],
    },
  ],
};

/** Canonical list of gate actions (for API validation). */
export const ALL_LEGAL_GATE_ACTIONS: readonly LegalGateAction[] = [
  "publish_listing",
  "start_booking",
  "complete_booking",
  "submit_offer",
  "accept_offer",
  "activate_host_listing",
  "unlock_contact",
  "become_broker",
];
