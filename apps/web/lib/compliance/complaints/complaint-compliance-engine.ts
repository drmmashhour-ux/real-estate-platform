export type ComplaintGovernanceFacts = {
  hasWrittenComplaintPolicy: boolean;
  complaintStatus: string;
  hasClassificationReview: boolean;
  assignedOwnerUserId: string | null;
  daysOpen: number;
  /** Target days to acknowledge (policy or platform default). */
  acknowledgeSlaDays: number;
  complaintType: string;
  routingDecision: string | null;
  resolutionNote: string | null;
  falseAdvertisingViolationLinked: boolean;
  repeatedComplaintPattern: boolean;
  consumerProtectionExplained: boolean;
};

export type ComplaintRuleOutcome = {
  code: string;
  level: "pass" | "warn" | "fail";
  message: string;
};

export function evaluateComplaintGovernanceRules(f: ComplaintGovernanceFacts): ComplaintRuleOutcome[] {
  const out: ComplaintRuleOutcome[] = [];

  if (!f.hasWrittenComplaintPolicy) {
    out.push({
      code: "COMPLAINT_POLICY_MISSING",
      level: "fail",
      message: "Written complaint-handling policy is required for brokerage governance.",
    });
  }

  if (f.hasClassificationReview && !f.assignedOwnerUserId && !["new", "draft"].includes(f.complaintStatus)) {
    out.push({
      code: "COMPLAINT_UNASSIGNED_AFTER_REVIEW",
      level: "warn",
      message: "Complaint was classified but has no assigned owner.",
    });
  }

  if (f.daysOpen > f.acknowledgeSlaDays && !f.hasClassificationReview && f.complaintStatus === "new") {
    out.push({
      code: "COMPLAINT_AGING_ACK_SLA",
      level: "warn",
      message: `Complaint exceeded acknowledgement timeline (${f.acknowledgeSlaDays} days).`,
    });
  }

  if (
    ["resolved_internal", "closed"].includes(f.complaintStatus) &&
    (!f.resolutionNote || !String(f.resolutionNote).trim())
  ) {
    out.push({
      code: "COMPLAINT_RESOLUTION_NOTE_REQUIRED",
      level: "fail",
      message: "Resolved or closed complaints must record a resolution note.",
    });
  }

  if (f.falseAdvertisingViolationLinked && !f.hasClassificationReview) {
    out.push({
      code: "COMPLAINT_LINK_COMPLIANCE_CASE",
      level: "warn",
      message: "False-advertising signals should be linked to a compliance review record.",
    });
  }

  if (f.repeatedComplaintPattern) {
    out.push({
      code: "COMPLAINT_CAPA_REQUIRED_PATTERN",
      level: "warn",
      message: "Repeated complaint pattern — corrective / preventive actions should be recorded.",
    });
  }

  if (
    f.consumerProtectionExplained === false &&
    (f.complaintType === "consumer_rights_confusion" || f.complaintType === "public_assistance")
  ) {
    out.push({
      code: "CONSUMER_PROTECTION_EXPLANATION_MISSING",
      level: "warn",
      message: "Consumer protection explanation should be logged for this intake type.",
    });
  }

  if (out.length === 0) {
    out.push({ code: "COMPLAINT_GOVERNANCE_OK", level: "pass", message: "No governance violations detected." });
  }

  return out;
}
