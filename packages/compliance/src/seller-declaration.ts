export type SellerDeclarationInput = {
  listingId?: string | null;
  contractId?: string | null;
  referenceNumber?: string | null;
};

export function generateDSReference(): string {
  return "DS-" + Date.now();
}

/** @deprecated use generateDSReference */
export const generateDSRef = generateDSReference;

export function withDSReference<T extends SellerDeclarationInput>(input: T): T & { referenceNumber: string } {
  const trimmed = input.referenceNumber?.trim();
  return {
    ...input,
    referenceNumber: trimmed && trimmed.length > 0 ? trimmed : generateDSReference(),
  };
}

export function validateDS(input: SellerDeclarationInput): void {
  const hasListing = Boolean(input.listingId?.trim());
  const hasContract = Boolean(input.contractId?.trim());
  if (!hasListing && !hasContract) {
    throw new Error("DS_MUST_BE_LINKED_TO_TRANSACTION");
  }
}

/** Alias for LECIPM docs / external integrations — same rules as `validateDS`. */
export function validateSellerDeclarationLink(input: {
  listingId?: string | null;
  contractId?: string | null;
}): void {
  validateDS(input);
}
