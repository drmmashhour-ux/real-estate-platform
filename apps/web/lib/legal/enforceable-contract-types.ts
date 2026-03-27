/** Canonical `Contract.type` values for hub enforceable agreements (stored in existing `contracts` table). */
export const ENFORCEABLE_CONTRACT_TYPES = {
  BUYER: "enforceable_buyer",
  SELLER: "enforceable_seller",
  RENTAL: "enforceable_rental",
  SHORT_TERM: "enforceable_short_term",
  /** BNHub host — listing publish / activation acknowledgment. */
  HOST: "enforceable_host",
  BROKER: "enforceable_broker",
} as const;

export type EnforceableContractType = (typeof ENFORCEABLE_CONTRACT_TYPES)[keyof typeof ENFORCEABLE_CONTRACT_TYPES];
