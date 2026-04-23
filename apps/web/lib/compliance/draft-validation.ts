import { normalizeDraftingFormType } from "@/lib/ai/drafting-policy";

export type DraftValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

function isUnsetField(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && (v.trim() === "" || v.trim() === "REQUIRED_REVIEW")) return true;
  return false;
}

function validateDraftBaseFields(fields: Record<string, unknown> | null | undefined): DraftValidationResult {
  const errors: string[] = [];
  const f = fields ?? {};

  const addr = f.propertyAddress ?? f.address;
  if (addr === undefined || addr === null || String(addr).trim() === "") {
    errors.push("ADDRESS_REQUIRED");
  }

  const buyer = f.buyerName ?? f.buyer;
  if (buyer === undefined || buyer === null || String(buyer).trim() === "") {
    errors.push("BUYER_REQUIRED");
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}

/** Base address + buyer checks, or full `{ formType, fields }` validation when both are passed. */
export function validateDraft(fields: Record<string, unknown> | null | undefined): DraftValidationResult;
export function validateDraft(input: { formType: string; fields: Record<string, unknown> | null | undefined }): DraftValidationResult;
export function validateDraft(
  input: Record<string, unknown> | null | undefined | { formType: string; fields: Record<string, unknown> | null | undefined },
): DraftValidationResult {
  const maybeFields = input && typeof input === "object" && "fields" in input ? (input as { fields: unknown }).fields : undefined;
  if (
    input &&
    typeof input === "object" &&
    "formType" in input &&
    "fields" in input &&
    maybeFields !== undefined &&
    maybeFields !== null &&
    typeof maybeFields === "object" &&
    !Array.isArray(maybeFields)
  ) {
    const { formType, fields } = input as { formType: string; fields: Record<string, unknown> };
    return validateDraftWithFormType({ formType, fields });
  }
  return validateDraftBaseFields(input as Record<string, unknown> | null | undefined);
}

export type ConsistencyInput = {
  listing?: { address?: string | null };
  draft?: Record<string, unknown> | null;
};

export type ConsistencyResult = {
  valid: boolean;
  errors: string[];
};

export function checkConsistency(input: ConsistencyInput): ConsistencyResult {
  const errors: string[] = [];
  const listingAddr = input.listing?.address?.trim();
  const draftAddr =
    input.draft?.propertyAddress != null
      ? String(input.draft.propertyAddress).trim()
      : input.draft?.address != null
        ? String(input.draft.address).trim()
        : "";

  if (listingAddr && draftAddr && listingAddr !== draftAddr) {
    errors.push("ADDRESS_MISMATCH");
  }

  return { valid: errors.length === 0, errors };
}

/** Form-type required fields (OACIQ-aligned). Uses normalized `formType` buckets. */
export function validateDraftFieldsForFormType(input: { formType: string; fields: Record<string, unknown> }): DraftValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const f = input.fields ?? {};
  const formType = normalizeDraftingFormType(input.formType);

  if (formType === "seller_declaration") {
    if (isUnsetField(f.sellerName)) errors.push("SELLER_NAME_REQUIRED");
    if (isUnsetField(f.propertyAddress)) errors.push("PROPERTY_ADDRESS_REQUIRED");
    const hasDefects = f.knownDefects != null && String(f.knownDefects).trim() !== "";
    const refusal = f.refusalToDeclare === true;
    if (!hasDefects && !refusal) {
      errors.push("KNOWN_DEFECTS_OR_REFUSAL_REQUIRED");
    }
  }

  if (formType === "brokerage_contract") {
    if (isUnsetField(f.contractType)) errors.push("CONTRACT_TYPE_REQUIRED");
    if (isUnsetField(f.startDate)) errors.push("CONTRACT_START_DATE_REQUIRED");
    if (isUnsetField(f.endDate)) errors.push("CONTRACT_END_DATE_REQUIRED");
  }

  if (formType === "promise_to_purchase") {
    if (isUnsetField(f.buyerName)) errors.push("BUYER_NAME_REQUIRED");
    if (isUnsetField(f.sellerName)) errors.push("SELLER_NAME_REQUIRED");
    if (isUnsetField(f.propertyAddress)) errors.push("PROPERTY_ADDRESS_REQUIRED");
    if (isUnsetField(f.offerPrice)) errors.push("OFFER_PRICE_REQUIRED");
    if (isUnsetField(f.acceptanceDeadline)) errors.push("ACCEPTANCE_DEADLINE_REQUIRED");
  }

  if (formType === "counter_proposal") {
    if (isUnsetField(f.referencePromiseForm)) errors.push("REFERENCE_PROMISE_FORM_REQUIRED");
    if (isUnsetField(f.propertyAddress)) errors.push("PROPERTY_ADDRESS_REQUIRED");
    const am = f.amendments;
    if (!Array.isArray(am) || am.length === 0) {
      errors.push("COUNTER_PROPOSAL_AMENDMENTS_REQUIRED");
    }
  }

  if (formType === "annex_r") {
    if (isUnsetField(f.referencePromiseForm)) errors.push("REFERENCE_PROMISE_FORM_REQUIRED");
    if (isUnsetField(f.propertyAddress)) errors.push("PROPERTY_ADDRESS_REQUIRED");
  }

  if (formType === "notice_fulfilment_conditions") {
    if (isUnsetField(f.referencePromiseForm)) errors.push("REFERENCE_PROMISE_FORM_REQUIRED");
    if (isUnsetField(f.triggerClause)) errors.push("TRIGGER_CLAUSE_REQUIRED");
    if (isUnsetField(f.noticeOutcome)) errors.push("NOTICE_OUTCOME_REQUIRED");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateDraftAddressOnly(fields: Record<string, unknown> | null | undefined): DraftValidationResult {
  const errors: string[] = [];
  const f = fields ?? {};
  const addr = f.propertyAddress ?? f.address;
  if (addr === undefined || addr === null || String(addr).trim() === "") {
    errors.push("ADDRESS_REQUIRED");
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

/**
 * Per-form rules plus legacy address/buyer checks only where they apply (e.g. promise to purchase).
 */
export function validateDraftWithFormType(input: { formType: string; fields: Record<string, unknown> | null | undefined }): DraftValidationResult {
  const formType = normalizeDraftingFormType(input.formType);
  const facts = input.fields ?? {};

  const base: DraftValidationResult =
    formType === "identity_verification" || formType === "disclosure"
      ? { valid: true, errors: [], warnings: [] }
      : formType === "promise_to_purchase" || formType === "other"
        ? validateDraftBaseFields(facts)
        : validateDraftAddressOnly(facts);

  const typed = validateDraftFieldsForFormType({ formType: input.formType, fields: facts });
  return {
    valid: base.valid && typed.valid,
    errors: [...base.errors, ...typed.errors],
    warnings: [...base.warnings, ...typed.warnings],
  };
}

export function checkDraftContradictions(input: {
  listing?: { address?: string | null };
  sellerDeclaration?: { sellerName?: string | null };
  promiseToPurchase?: { buyerName?: string | null };
  draft?: { fields?: Record<string, unknown> };
}): ConsistencyResult {
  const errors: string[] = [];
  const f = input.draft?.fields ?? {};

  const draftAddr = f.propertyAddress != null ? String(f.propertyAddress).trim() : "";
  if (
    input.listing?.address &&
    draftAddr &&
    draftAddr !== "REQUIRED_REVIEW" &&
    String(input.listing.address).trim() !== draftAddr
  ) {
    errors.push("PROPERTY_ADDRESS_MISMATCH");
  }

  const draftSeller = f.sellerName != null ? String(f.sellerName).trim() : "";
  if (
    input.sellerDeclaration?.sellerName &&
    draftSeller &&
    draftSeller !== "REQUIRED_REVIEW" &&
    String(input.sellerDeclaration.sellerName).trim() !== draftSeller
  ) {
    errors.push("SELLER_NAME_MISMATCH");
  }

  const draftBuyer = f.buyerName != null ? String(f.buyerName).trim() : "";
  if (
    input.promiseToPurchase?.buyerName &&
    draftBuyer &&
    draftBuyer !== "REQUIRED_REVIEW" &&
    String(input.promiseToPurchase.buyerName).trim() !== draftBuyer
  ) {
    errors.push("BUYER_NAME_MISMATCH");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
