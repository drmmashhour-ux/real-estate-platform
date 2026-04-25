/**
 * OACIQ-aligned AI boundaries: software may assist; it may not replace the licensed broker’s final judgment
 * on legally binding brokerage actions (offers, contracts, publication, deal creation, negotiation commitments).
 *
 * Server routes reject `lecipmDecisionSource` / `decisionSource` values that imply unattended finalization
 * (see `assertLegallyBindingCallerNotAutomated` in `broker-decision-authority.ts`).
 */

export const LECIPM_AI_ALLOWED_ROLES_SUMMARY =
  "AI may suggest, draft, and analyze. AI must not approve, finalize, or submit binding brokerage outcomes.";
