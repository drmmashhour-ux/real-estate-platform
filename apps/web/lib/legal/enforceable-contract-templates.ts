import { CONTRACT_TEMPLATE_MARKDOWN } from "@/modules/legal/contract-templates";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";

export const ENFORCEABLE_TEMPLATE_VERSION = "2025-03-24-v2";

export type EnforceableTemplateKind = keyof typeof TITLES;

export function getEnforceableTemplate(kind: EnforceableTemplateKind): {
  type: string;
  title: string;
  body: string;
  version: string;
} {
  const body = BODIES[kind];
  return {
    type: TYPES[kind],
    title: TITLES[kind],
    body,
    version: ENFORCEABLE_TEMPLATE_VERSION,
  };
}

const TITLES = {
  buyer: "Buyer agreement — platform acknowledgment",
  seller: "Seller listing agreement — accuracy & compliance",
  rental: "Long-term rental — platform acknowledgment",
  shortTerm: "Short-term stay — guest acknowledgment",
  host: "BNHUB host — listing & payouts acknowledgment",
  broker: "Broker collaboration — platform acknowledgment",
} as const;

const TYPES: Record<keyof typeof TITLES, string> = {
  buyer: ENFORCEABLE_CONTRACT_TYPES.BUYER,
  seller: ENFORCEABLE_CONTRACT_TYPES.SELLER,
  rental: ENFORCEABLE_CONTRACT_TYPES.RENTAL,
  shortTerm: ENFORCEABLE_CONTRACT_TYPES.SHORT_TERM,
  host: ENFORCEABLE_CONTRACT_TYPES.HOST,
  broker: ENFORCEABLE_CONTRACT_TYPES.BROKER,
};

const BODIES: Record<keyof typeof TITLES, string> = {
  buyer: CONTRACT_TEMPLATE_MARKDOWN.buyerAgreement,
  seller: CONTRACT_TEMPLATE_MARKDOWN.sellerAgreement,
  rental: CONTRACT_TEMPLATE_MARKDOWN.rentalAgreement,
  shortTerm: CONTRACT_TEMPLATE_MARKDOWN.shortTermStayAgreement,
  host: [
    "Host acknowledgment: you are responsible for listing accuracy, house rules, and compliance with local short-term rental rules.",
    "Payouts follow platform fee schedules; disputes may delay payouts until resolved.",
    "You agree to honor confirmed bookings and platform cancellation policies as configured on your listing.",
  ].join("\n\n"),
  broker: [
    "Broker collaboration: the platform may facilitate referrals and commission arrangements.",
    "Keep material communications on-platform where required by workflow; circumvention may affect eligibility.",
    "You remain responsible for your license obligations and brokerage policies.",
    "Limitation: the platform provides tools and connectivity, not guarantees of commission or deal closure.",
  ].join("\n\n"),
};
