import { OACIQ_VIA_MESSAGES } from "@/lib/compliance/oaciq/verify-inform-advise/messages";
import {
  OACIQ_ADVICE_ENGINE,
  OACIQ_INFORMATION_ENGINE,
  OACIQ_INSPECTION_RULES,
  OACIQ_LEGAL_WARRANTY_ENGINE,
  OACIQ_PRICING_ENGINE,
  OACIQ_VERIFICATION_ENGINE,
  OACIQ_VIA_RISK_ENGINE,
  OACIQ_VIA_SIGNATURE_CHAIN,
} from "@/lib/compliance/oaciq/verify-inform-advise/rule-engines";
import type { OaciqViaEvaluation } from "@/lib/compliance/oaciq/verify-inform-advise/evaluate";

export type OaciqViaReferenceBundle = {
  framework: "VERIFY_INFORM_ADVISE";
  verification: typeof OACIQ_VERIFICATION_ENGINE;
  information: typeof OACIQ_INFORMATION_ENGINE;
  advice: typeof OACIQ_ADVICE_ENGINE;
  inspection: typeof OACIQ_INSPECTION_RULES;
  pricing: typeof OACIQ_PRICING_ENGINE;
  legalWarranty: typeof OACIQ_LEGAL_WARRANTY_ENGINE;
  risk: typeof OACIQ_VIA_RISK_ENGINE;
  signatureChain: typeof OACIQ_VIA_SIGNATURE_CHAIN;
  messages: typeof OACIQ_VIA_MESSAGES;
};

export function buildOaciqViaReferenceBundle(): OaciqViaReferenceBundle {
  return {
    framework: "VERIFY_INFORM_ADVISE",
    verification: OACIQ_VERIFICATION_ENGINE,
    information: OACIQ_INFORMATION_ENGINE,
    advice: OACIQ_ADVICE_ENGINE,
    inspection: OACIQ_INSPECTION_RULES,
    pricing: OACIQ_PRICING_ENGINE,
    legalWarranty: OACIQ_LEGAL_WARRANTY_ENGINE,
    risk: OACIQ_VIA_RISK_ENGINE,
    signatureChain: OACIQ_VIA_SIGNATURE_CHAIN,
    messages: OACIQ_VIA_MESSAGES,
  };
}

export type ListingAssistantViaAttachment = {
  evaluation: OaciqViaEvaluation;
  inspectionReminder: { fr: string; en: string };
  legalWarrantyNote: { fr: string; en: string };
  aiLimitation: { fr: string; en: string };
  flow: "VERIFY → INFORM → ADVISE → SIGN";
};

export function buildListingAssistantViaAttachment(evaluation: OaciqViaEvaluation): ListingAssistantViaAttachment {
  return {
    evaluation,
    inspectionReminder: {
      fr: OACIQ_VIA_MESSAGES.inspectionBuyerFr,
      en: OACIQ_VIA_MESSAGES.inspectionBuyerEn,
    },
    legalWarrantyNote: {
      fr: OACIQ_VIA_MESSAGES.legalWarrantyFr,
      en: OACIQ_VIA_MESSAGES.legalWarrantyEn,
    },
    aiLimitation: {
      fr: OACIQ_VIA_MESSAGES.aiLimitFr,
      en: OACIQ_VIA_MESSAGES.aiLimitEn,
    },
    flow: "VERIFY → INFORM → ADVISE → SIGN",
  };
}
