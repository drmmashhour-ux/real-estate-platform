import type { AmfExemptionCategory } from "@prisma/client";

/** Québec AMF minimum fee for exempt distribution reporting (simulation default — verify with counsel for period). */
export const DEFAULT_AMF_EXEMPT_DISTRIBUTION_FEE_CAD = 353;

/** Days after distribution date to initialize filing deadline tracker (operational default — not legal advice). */
export const DEFAULT_FILING_DEADLINE_OFFSET_DAYS = 10;

/** Enabled without counsel flag — all other exemption categories require `counselApprovedExemptionsJson` on SPV. */
export const DEFAULT_ENABLED_EXEMPTIONS: AmfExemptionCategory[] = [
  "ACCREDITED_INVESTOR",
  "FAMILY_FRIENDS_BUSINESS_ASSOCIATES",
];

export const EXEMPT_DOCUMENT_CHECKLIST_KEYS = [
  "subscription_agreement",
  "risk_disclosure",
  "investor_questionnaire",
  "exemption_representation",
  "issuer_deal_summary",
  "classification_audit_trail",
] as const;

export type ExemptDocumentChecklistKey = (typeof EXEMPT_DOCUMENT_CHECKLIST_KEYS)[number];

export function buildDefaultDocumentChecklistJson(): Record<
  string,
  { required: boolean; label: string; done: boolean }
> {
  return {
    subscription_agreement: { required: true, label: "Subscription agreement", done: false },
    risk_disclosure: { required: true, label: "Risk disclosure", done: false },
    investor_questionnaire: { required: true, label: "Investor questionnaire", done: false },
    exemption_representation: { required: true, label: "Exemption representation", done: false },
    issuer_deal_summary: { required: true, label: "Issuer / deal summary", done: false },
    classification_audit_trail: { required: true, label: "Audit trail of investor classification", done: false },
  };
}

const FORBIDDEN_SUBSCRIPTION_PHRASES = [
  /guaranteed?\s+return/i,
  /assured\s+return/i,
  /no\s+risk/i,
  /risk[- ]free/i,
];

export function assertNoGuaranteeLanguageInPayload(payload: unknown) {
  const s = JSON.stringify(payload ?? {});
  for (const re of FORBIDDEN_SUBSCRIPTION_PHRASES) {
    if (re.test(s)) {
      throw new Error("FORBIDDEN_GUARANTEE_LANGUAGE");
    }
  }
}
