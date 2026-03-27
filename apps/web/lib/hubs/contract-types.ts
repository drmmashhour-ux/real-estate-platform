/**
 * Unified contract engine – types used across all hubs.
 *
 * ⚠️ INVESTMENT_AGREEMENT: offering investment contracts to end users may trigger AMF / securities
 * regulation in Québec. Keep investment flows disabled until `isInvestmentFeaturesEnabled()` is true
 * and counsel approves (see `lib/compliance/investment-features.ts`).
 */

export const CONTRACT_TYPES = {
  BOOKING_CONTRACT: "booking_contract",
  LISTING_CONTRACT: "listing_contract",
  /** Short-term / residential lease with e-sign (Québec-style template). */
  LEASE: "lease",
  /** Legacy single broker agreement type. */
  BROKER_AGREEMENT: "broker_agreement",
  /** Broker–client listing / seller mandate. */
  BROKER_AGREEMENT_SELLER: "broker_agreement_seller",
  /** Buyer representation / search mandate. */
  BROKER_AGREEMENT_BUYER: "broker_agreement_buyer",
  /** Referral between mortgage expert, broker, or platform. */
  REFERRAL_AGREEMENT: "referral_agreement",
  /** Broker-to-broker cooperation / split. */
  COLLABORATION_AGREEMENT: "collaboration_agreement",
  /** Purchase offer (promise to purchase style). */
  OFFER_PURCHASE: "purchase_offer",
  /** Rental offer (long-term style). */
  OFFER_RENTAL: "rental_offer",
  INVESTMENT_AGREEMENT: "investment_agreement",
} as const;

/** Types that use the shared e-sign UI + /contracts/[id]. */
export const E_SIGN_CONTRACT_TYPES = new Set<string>([
  CONTRACT_TYPES.LEASE,
  CONTRACT_TYPES.BROKER_AGREEMENT,
  CONTRACT_TYPES.BROKER_AGREEMENT_SELLER,
  CONTRACT_TYPES.BROKER_AGREEMENT_BUYER,
  CONTRACT_TYPES.REFERRAL_AGREEMENT,
  CONTRACT_TYPES.COLLABORATION_AGREEMENT,
  CONTRACT_TYPES.OFFER_PURCHASE,
  CONTRACT_TYPES.OFFER_RENTAL,
  /** Marketplace FSBO / rental / host — simple sign or full e-sign depending on flow */
  "SELLER_AGREEMENT",
  "PLATFORM_TERMS",
  "BROKER_COLLABORATION",
  "BROKER_AGREEMENT",
  "RENTAL_AGREEMENT",
  "HOST_AGREEMENT",
  /** Hub enforceable agreements (`lib/legal/enforceable-contract-types.ts`) */
  "enforceable_buyer",
  "enforceable_seller",
  "enforceable_rental",
  "enforceable_short_term",
  "enforceable_host",
  "enforceable_broker",
]);

/** E-sign lease workflow (stored in `Contract.status`). */
export const LEASE_CONTRACT_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  SIGNED: "signed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ContractType = (typeof CONTRACT_TYPES)[keyof typeof CONTRACT_TYPES];

/** Which contract type to auto-generate for hub + action */
export const CONTRACT_BY_ACTION: Record<string, ContractType> = {
  booking: "booking_contract",
  "listing_publish": "listing_contract",
  "lead_assignment": "broker_agreement",
  "investment": "investment_agreement",
};

export const LISTING_STATUSES = ["draft", "pending_review", "approved", "published"] as const;
export type ListingStatusValue = (typeof LISTING_STATUSES)[number];

/** Required fields for listing validation (all hubs) */
export const REQUIRED_LISTING_FIELDS = [
  "title",
  "description",
  "price",
  "location",
  "images",
] as const;
