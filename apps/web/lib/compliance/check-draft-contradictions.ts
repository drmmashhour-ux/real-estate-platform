export function checkDraftContradictions(input: {
  listing?: { address?: string | null } | null;
  sellerDeclaration?: { sellerName?: string | null } | null;
  brokerageContract?: Record<string, unknown> | null;
  promiseToPurchase?: {
    buyerName?: string | null;
    offerPrice?: string | number | null;
  } | null;
  draft?: { fields?: Record<string, unknown> };
}) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const f = input.draft?.fields ?? {};

  if (input.listing?.address && f.propertyAddress && input.listing.address !== f.propertyAddress) {
    errors.push("PROPERTY_ADDRESS_MISMATCH");
  }

  if (
    input.sellerDeclaration?.sellerName &&
    f.sellerName &&
    input.sellerDeclaration.sellerName !== f.sellerName
  ) {
    errors.push("SELLER_NAME_MISMATCH");
  }

  if (
    input.promiseToPurchase?.buyerName &&
    f.buyerName &&
    input.promiseToPurchase.buyerName !== f.buyerName
  ) {
    errors.push("BUYER_NAME_MISMATCH");
  }

  if (
    input.promiseToPurchase?.offerPrice != null &&
    f.offerPrice != null &&
    Number(input.promiseToPurchase.offerPrice) !== Number(f.offerPrice)
  ) {
    warnings.push("OFFER_PRICE_DIFFERS_FROM_EXISTING_PROMISE");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
