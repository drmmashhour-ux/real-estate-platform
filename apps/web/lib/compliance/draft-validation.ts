export type DraftValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateDraft(fields: Record<string, unknown> | null | undefined): DraftValidationResult {
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

  return { valid: errors.length === 0, errors };
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
