import type { ComplaintReferralDestination } from "@/modules/complaints/schemas/escalation-referral.schema";
import type { ComplaintSeverity, ComplaintType } from "@/modules/complaints/schemas/complaint-review.schema";

export type ComplaintRoutingProfile = {
  internalOnly: boolean;
  consumerProtectionExplanation: boolean;
  suggestPublicAssistance: boolean;
  suggestInfoOaciq: boolean;
  suggestSyndic: boolean;
  highPriorityInternal: boolean;
};

const ETHICAL_KEYWORDS =
  /\b(misrepresent|misleading|false advertising|syndic|trust account|trust money|fraud|conceal|ethical|déontologie|obligation professionnelle)\b/i;
const RIGHTS_CONFUSION_KEYWORDS =
  /\b(don't understand|confused|rights|obligation|contract explain|what can i do|protect myself)\b/i;
const AML_KEYWORDS = /\b(aml|money laundering|fraudulent|forgery|identity theft)\b/i;

/** Deterministic classification from intake signals (human review still required for production routing). */
export function classifyComplaint(input: {
  complaintType: string;
  description: string;
  mentionsTrustMoney?: boolean;
  mentionsFraud?: boolean;
  repeatedPattern?: boolean;
}): ComplaintType {
  const d = input.description ?? "";
  if (input.complaintType === "public_assistance") {
    return "public_assistance";
  }
  if (RIGHTS_CONFUSION_KEYWORDS.test(d)) {
    return "consumer_rights_confusion";
  }
  if (input.mentionsFraud || input.mentionsTrustMoney || AML_KEYWORDS.test(d)) {
    return "aml_fraud_trust";
  }
  if (
    input.complaintType === "advertising_issue" ||
    /\b(false advertising|misleading ad|promotion)\b/i.test(d)
  ) {
    return "advertising_misleading";
  }
  if (
    input.complaintType === "record_issue" ||
    /\b(records?|files? missing|documentation)\b/i.test(d)
  ) {
    return "record_keeping";
  }
  if (
    input.complaintType === "conduct_issue" ||
    input.repeatedPattern ||
    ETHICAL_KEYWORDS.test(d)
  ) {
    return "ethical_conduct";
  }
  if (
    input.complaintType === "service_issue" ||
    input.complaintType === "communication_issue"
  ) {
    return "internal_service";
  }
  return "other";
}

export function determineComplaintRoute(classification: ComplaintType): ComplaintRoutingProfile {
  switch (classification) {
    case "internal_service":
      return {
        internalOnly: true,
        consumerProtectionExplanation: false,
        suggestPublicAssistance: false,
        suggestInfoOaciq: false,
        suggestSyndic: false,
        highPriorityInternal: false,
      };
    case "consumer_rights_confusion":
      return {
        internalOnly: true,
        consumerProtectionExplanation: true,
        suggestPublicAssistance: true,
        suggestInfoOaciq: true,
        suggestSyndic: false,
        highPriorityInternal: false,
      };
    case "public_assistance":
      return {
        internalOnly: false,
        consumerProtectionExplanation: true,
        suggestPublicAssistance: true,
        suggestInfoOaciq: true,
        suggestSyndic: false,
        highPriorityInternal: false,
      };
    case "ethical_conduct":
    case "advertising_misleading":
      return {
        internalOnly: true,
        consumerProtectionExplanation: true,
        suggestPublicAssistance: false,
        suggestInfoOaciq: true,
        suggestSyndic: true,
        highPriorityInternal: true,
      };
    case "aml_fraud_trust":
    case "record_keeping":
      return {
        internalOnly: true,
        consumerProtectionExplanation: true,
        suggestPublicAssistance: false,
        suggestInfoOaciq: true,
        suggestSyndic: true,
        highPriorityInternal: true,
      };
    default:
      return {
        internalOnly: true,
        consumerProtectionExplanation: false,
        suggestPublicAssistance: false,
        suggestInfoOaciq: false,
        suggestSyndic: false,
        highPriorityInternal: false,
      };
  }
}

export function suggestOaciqReferral(profile: ComplaintRoutingProfile): ComplaintReferralDestination | null {
  if (profile.suggestInfoOaciq) return "info_oaciq";
  return null;
}

export function suggestSyndicReferral(profile: ComplaintRoutingProfile): ComplaintReferralDestination | null {
  if (profile.suggestSyndic) return "syndic";
  return null;
}

export function mapSeverityForClassification(
  classification: ComplaintType,
  prior: ComplaintSeverity
): ComplaintSeverity {
  if (classification === "aml_fraud_trust") return "critical";
  if (classification === "ethical_conduct" || classification === "advertising_misleading") {
    return prior === "low" ? "medium" : prior;
  }
  return prior;
}
