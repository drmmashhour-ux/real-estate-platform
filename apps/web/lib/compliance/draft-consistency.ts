/** Minimal listing vs `draft.fields.propertyAddress` (integration / guard samples). */
export function checkConsistency(input: {
  listing?: { address?: string | null } | null;
  draft?: { fields?: Record<string, unknown> } | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (
    input.listing?.address &&
    input.draft?.fields?.propertyAddress &&
    String(input.listing.address).trim() !== String(input.draft.fields.propertyAddress).trim()
  ) {
    errors.push("ADDRESS_MISMATCH");
  }
  return { valid: errors.length === 0, errors };
}

export function checkDraftConsistency(input: {
  listing?: { address?: string | null } | null;
  sellerDeclaration?: { sellerName?: string | null } | null;
  brokerageContract?: Record<string, unknown> | null;
  promiseToPurchase?: { buyerName?: string | null; offerPrice?: string | number | null } | null;
  draft?: { fields?: Record<string, unknown> };
}) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const draftFields = input.draft?.fields ?? {};

  if (
    input.listing?.address &&
    draftFields.propertyAddress &&
    String(input.listing.address).trim() !== String(draftFields.propertyAddress).trim()
  ) {
    errors.push("PROPERTY_ADDRESS_MISMATCH");
  }

  if (
    input.sellerDeclaration?.sellerName &&
    draftFields.sellerName &&
    String(input.sellerDeclaration.sellerName).trim() !== String(draftFields.sellerName).trim()
  ) {
    errors.push("SELLER_NAME_MISMATCH");
  }

  if (
    input.promiseToPurchase?.buyerName &&
    draftFields.buyerName &&
    String(input.promiseToPurchase.buyerName).trim() !== String(draftFields.buyerName).trim()
  ) {
    errors.push("BUYER_NAME_MISMATCH");
  }

  if (
    input.promiseToPurchase?.offerPrice != null &&
    draftFields.offerPrice != null &&
    Number(input.promiseToPurchase.offerPrice) !== Number(draftFields.offerPrice)
  ) {
    warnings.push("OFFER_PRICE_DIFFERS_FROM_EXISTING_PROMISE");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
