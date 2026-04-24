/**
 * Draft document templates for BNHub / LECIPM — informational only, not legal advice.
 */

export type LegalTemplateId =
  | "booking_agreement"
  | "rental_agreement"
  | "broker_agreement"
  | "cancellation_policy";

export type LegalTemplateDefinition = {
  id: LegalTemplateId;
  title: string;
  /** Markdown body with `{{PLACEHOLDER}}` tokens (upper snake case). */
  body: string;
  /** Placeholder keys this template expects (for UI hints). */
  suggestedKeys: string[];
};
