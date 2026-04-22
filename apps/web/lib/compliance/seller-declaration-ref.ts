/**
 * DS linkage + internal reference — does not imply a specific regulator “contract number” requirement.
 */

/** Unique internal reference for audit trail (DS-〈timestamp〉). */
export function generateDeclarationRef(): string {
  return `DS-${Date.now()}`;
}

export type SellerDeclarationLinkInput = {
  listingId?: string | null;
  contractId?: string | null;
  referenceNumber?: string | null;
};

/** Ensures DS row is tied to transaction context (listing and/or contract). */
export function assertSellerDeclarationLinked(input: SellerDeclarationLinkInput): void {
  const hasListing = Boolean(input.listingId?.trim());
  const hasContract = Boolean(input.contractId?.trim());
  if (!hasListing && !hasContract) {
    throw new Error("DS_MUST_BE_LINKED_TO_TRANSACTION");
  }
}

/** Assign reference when missing — idempotent when already set. */
export function ensureDeclarationReference<T extends SellerDeclarationLinkInput>(row: T): T & { referenceNumber: string } {
  if (row.referenceNumber?.trim()) {
    return row as T & { referenceNumber: string };
  }
  return { ...row, referenceNumber: generateDeclarationRef() };
}
