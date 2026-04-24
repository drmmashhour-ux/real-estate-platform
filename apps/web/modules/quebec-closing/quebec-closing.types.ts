export const QC_CLOSING_STAGES = [
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "CONDITIONS_PENDING",
  "CONDITIONS_SATISFIED",
  "NOTARY_ASSIGNED",
  "NOTARY_DOCUMENT_REVIEW",
  "SIGNING_SCHEDULED",
  "DEED_SIGNED",
  "LAND_REGISTER_PENDING",
  "CLOSED",
  "KEYS_RELEASED",
] as const;

export type QcClosingStage = (typeof QC_CLOSING_STAGES)[number];

export const QC_NOTARY_CHECKLIST_KEYS = [
  "CERTIFICATE_OF_LOCATION",
  "TAX_STATEMENTS",
  "MORTGAGE_INSTRUCTIONS",
  "TITLE_SEARCH",
  "ADJUSTMENT_STATEMENT",
] as const;

export type QcNotaryChecklistKey = (typeof QC_NOTARY_CHECKLIST_KEYS)[number];

export const QC_NOTARY_CHECKLIST_LABELS: Record<QcNotaryChecklistKey, string> = {
  CERTIFICATE_OF_LOCATION: "Certificate of location",
  TAX_STATEMENTS: "Tax statements (municipal / school)",
  MORTGAGE_INSTRUCTIONS: "Mortgage / lender instructions",
  TITLE_SEARCH: "Title search / radiations",
  ADJUSTMENT_STATEMENT: "Adjustment statement (statement of adjustments)",
};

export const QC_CONDITION_TYPES = {
  financing: "financing",
  inspection: "inspection",
  seller_declaration: "seller_declaration",
  amendment_counter: "amendment_counter",
} as const;

export type DealClosingAdjustmentKind =
  | "MUNICIPAL_TAX"
  | "SCHOOL_TAX"
  | "CONDO_COMMON"
  | "RENT_DEPOSIT"
  | "PREPAID"
  | "OCCUPANCY"
  | "OTHER";
