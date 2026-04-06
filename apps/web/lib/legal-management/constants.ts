export const CORPORATE_LEGAL_DOC_TYPES = [
  "shareholder_agreement",
  "privacy_policy",
  "terms",
] as const;

export type CorporateLegalDocType = (typeof CORPORATE_LEGAL_DOC_TYPES)[number];

export const CORPORATE_LEGAL_STATUSES = ["draft", "signed"] as const;
export type CorporateLegalStatus = (typeof CORPORATE_LEGAL_STATUSES)[number];

export const CORPORATE_DOC_TYPE_LABELS: Record<CorporateLegalDocType, string> = {
  shareholder_agreement: "Shareholder agreement",
  privacy_policy: "Privacy policy",
  terms: "Terms",
};

export function isCorporateLegalDocType(v: string): v is CorporateLegalDocType {
  return (CORPORATE_LEGAL_DOC_TYPES as readonly string[]).includes(v);
}

export function isCorporateLegalStatus(v: string): v is CorporateLegalStatus {
  return (CORPORATE_LEGAL_STATUSES as readonly string[]).includes(v);
}
