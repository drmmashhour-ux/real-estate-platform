/**
 * Canonical marketplace contract `Contract.type` values (string column).
 * Also used for analytics and enforcement.
 */
export const MARKETPLACE_CONTRACT_TYPES = {
  SELLER_AGREEMENT: "SELLER_AGREEMENT",
  /** Broker professional / mandate terms (distinct from legacy `broker_agreement` lease flows). */
  BROKER_AGREEMENT: "BROKER_AGREEMENT",
  BROKER_COLLABORATION: "BROKER_COLLABORATION",
  PLATFORM_TERMS: "PLATFORM_TERMS",
  RENTAL_AGREEMENT: "RENTAL_AGREEMENT",
  HOST_AGREEMENT: "HOST_AGREEMENT",
} as const;

export type MarketplaceContractType =
  (typeof MARKETPLACE_CONTRACT_TYPES)[keyof typeof MARKETPLACE_CONTRACT_TYPES];

export const FSBO_REQUIRED_CONTRACT_TYPES: readonly MarketplaceContractType[] = [
  MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT,
  MARKETPLACE_CONTRACT_TYPES.PLATFORM_TERMS,
];

/** FSBO sale (default). Long-term rent adds `RENTAL_AGREEMENT`. */
export function getFsboRequiredContractTypes(listingDealType: string | null | undefined): MarketplaceContractType[] {
  const base: MarketplaceContractType[] = [
    MARKETPLACE_CONTRACT_TYPES.SELLER_AGREEMENT,
    MARKETPLACE_CONTRACT_TYPES.PLATFORM_TERMS,
  ];
  const t = (listingDealType ?? "SALE").toUpperCase();
  if (t === "RENT" || t === "LONG_TERM_RENT" || t === "LONG_TERM_RENTAL" || t === "RENTAL") {
    return [...base, MARKETPLACE_CONTRACT_TYPES.RENTAL_AGREEMENT];
  }
  return base;
}
