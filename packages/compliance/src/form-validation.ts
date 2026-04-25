export type FormValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validatePrefilledForm(input: {
  formType: string;
  fields: Record<string, unknown>;
  context: Record<string, unknown>;
}): FormValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.formType === "seller_declaration") {
    if (!input.fields.sellerName) errors.push("SELLER_NAME_REQUIRED");
    if (!input.fields.propertyAddress) errors.push("PROPERTY_ADDRESS_REQUIRED");
    if (!input.fields.knownDefects && input.fields.refusalToDeclare !== true) {
      errors.push("KNOWN_DEFECTS_OR_REFUSAL_REQUIRED");
    }
    const listingId = input.context?.listingId;
    const contractId = input.context?.contractId;
    const hasListing = listingId != null && String(listingId).trim() !== "";
    const hasContract = contractId != null && String(contractId).trim() !== "";
    if (!hasListing && !hasContract) {
      errors.push("DS_MUST_BE_LINKED_TO_TRANSACTION");
    }
  }

  if (input.formType === "brokerage_contract") {
    if (!input.fields.contractType) errors.push("CONTRACT_TYPE_REQUIRED");
    if (!input.fields.startDate) errors.push("CONTRACT_START_DATE_REQUIRED");
    if (!input.fields.endDate) errors.push("CONTRACT_END_DATE_REQUIRED");
  }

  if (input.formType === "promise_to_purchase") {
    if (!input.fields.buyerName) errors.push("BUYER_NAME_REQUIRED");
    if (!input.fields.offerPrice) errors.push("OFFER_PRICE_REQUIRED");
    if (!input.fields.acceptanceDeadline) errors.push("ACCEPTANCE_DEADLINE_REQUIRED");
  }

  if (
    input.fields.listingAddress &&
    input.fields.propertyAddress &&
    input.fields.listingAddress !== input.fields.propertyAddress
  ) {
    errors.push("ADDRESS_MISMATCH");
  }

  if (input.fields.offerPrice && Number(input.fields.offerPrice) <= 0) {
    errors.push("INVALID_OFFER_PRICE");
  }

  if (input.fields.startDate && input.fields.endDate) {
    const start = new Date(String(input.fields.startDate));
    const end = new Date(String(input.fields.endDate));
    if (end <= start) errors.push("INVALID_CONTRACT_DATE_RANGE");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
