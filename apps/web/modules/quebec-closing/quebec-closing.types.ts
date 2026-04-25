/**
 * Québec notarial closing sequence — accepted offer → conditions → notary → signing → closed.
 * (Legacy stage strings are normalized via `normalizeQcClosingStage`.)
 */
export const QC_CLOSING_STAGES = [
  "OFFER_ACCEPTED",
  "CONDITIONS_PENDING",
  "CONDITIONS_MET",
  "NOTARY_ASSIGNED",
  "DOCUMENT_PREP",
  "SIGNING_READY",
  "SIGNED",
  "CLOSED",
] as const;

export type QcClosingStage = (typeof QC_CLOSING_STAGES)[number];

const LEGACY_QC_STAGE_MAP: Record<string, QcClosingStage> = {
  OFFER_SENT: "OFFER_ACCEPTED",
  CONDITIONS_SATISFIED: "CONDITIONS_MET",
  NOTARY_DOCUMENT_REVIEW: "DOCUMENT_PREP",
  SIGNING_SCHEDULED: "SIGNING_READY",
  DEED_SIGNED: "SIGNED",
  LAND_REGISTER_PENDING: "SIGNED",
  KEYS_RELEASED: "CLOSED",
};

/** Maps DB values from older builds to current `QC_CLOSING_STAGES`. */
export function normalizeQcClosingStage(raw: string | null | undefined): QcClosingStage | null {
  if (!raw) return null;
  if ((QC_CLOSING_STAGES as readonly string[]).includes(raw)) return raw as QcClosingStage;
  return LEGACY_QC_STAGE_MAP[raw] ?? null;
}

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
  /** Seller / document review (declarations, annexes, title-related seller docs). */
  document_review: "document_review",
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
