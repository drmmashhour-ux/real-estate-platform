export type ComplaintDecision =
  | { allowed: true; warning?: string }
  | { allowed: false; reason: string };

export function classifyComplaintSeverity(input: {
  complaintType: string;
  mentionsTrustMoney?: boolean;
  mentionsFraud?: boolean;
  repeatedPattern?: boolean;
}) {
  if (input.mentionsFraud || input.mentionsTrustMoney) return "critical";
  if (input.repeatedPattern) return "high";

  if (
    input.complaintType === "conduct_issue" ||
    input.complaintType === "advertising_issue" ||
    input.complaintType === "record_issue"
  ) {
    return "medium";
  }

  return "low";
}

export function suggestComplaintRouting(input: {
  complaintType: string;
  severity: string;
  mentionsFraud?: boolean;
  mentionsTrustMoney?: boolean;
}) {
  if (input.complaintType === "public_assistance") {
    return "public_assistance";
  }

  if (input.mentionsFraud || input.mentionsTrustMoney) {
    return "syndic_candidate";
  }

  if (input.severity === "high" || input.severity === "critical") {
    return "compliance_review";
  }

  return "internal_service";
}

/** Mandatory regulatory overrides — trust money & fraud types are always critical + syndic_candidate. */
export function applyMandatoryComplaintRules(input: {
  complaintType: string;
  severity: string;
  routingDecision: string;
}): {
  severity: string;
  routingDecision: string;
  intakeFlags: Record<string, boolean>;
} {
  let severity = input.severity;
  let routingDecision = input.routingDecision;
  const intakeFlags: Record<string, boolean> = {};

  if (input.complaintType === "trust_money_issue" || input.complaintType === "fraud_risk") {
    severity = "critical";
    routingDecision = "syndic_candidate";
  }

  if (routingDecision === "syndic_candidate") {
    intakeFlags.requireManualComplianceReviewer = true;
  }
  if (routingDecision === "public_assistance") {
    intakeFlags.requireConsumerGuidanceFlow = true;
  }

  return { severity, routingDecision, intakeFlags };
}

export function assertComplaintRoutingPresent(routingDecision: string | null | undefined): void {
  if (!routingDecision?.trim()) {
    throw new Error("COMPLAINT_ROUTING_DECISION_REQUIRED");
  }
}

export function validateComplaintClosure(input: {
  status: string;
  routingDecision: string | null | undefined;
  reviewerAcknowledged?: boolean;
}): ComplaintDecision {
  if (!input.routingDecision?.trim()) {
    return { allowed: false, reason: "COMPLAINT_ROUTING_DECISION_REQUIRED" };
  }

  if (!["resolved_internal", "closed"].includes(input.status)) {
    return { allowed: false, reason: "COMPLAINT_NOT_IN_CLOSABLE_STATUS" };
  }

  if (input.routingDecision === "syndic_candidate" && !input.reviewerAcknowledged) {
    return { allowed: false, reason: "COMPLAINT_CANNOT_CLOSE_WITHOUT_ACCOUNTABLE_REVIEW" };
  }

  return { allowed: true };
}
