import { describe, expect, it } from "vitest";
import { evaluateComplaintGovernanceRules } from "@/lib/compliance/complaints/complaint-compliance-engine";
import {
  classifyComplaint,
  determineComplaintRoute,
  suggestSyndicReferral,
} from "@/lib/compliance/complaints/complaint-routing.service";
import { getComplaintResponsibilityMode } from "@/lib/compliance/complaints/responsibility-mode";
import { getComplaintAgingState } from "@/lib/compliance/complaints/complaint-management.service";

describe("complaint governance rules", () => {
  it("fails when written complaint policy is missing", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: false,
      complaintStatus: "new",
      hasClassificationReview: false,
      assignedOwnerUserId: null,
      daysOpen: 0,
      acknowledgeSlaDays: 5,
      complaintType: "internal_service",
      routingDecision: "internal_service",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: false,
    });
    expect(r.some((x) => x.code === "COMPLAINT_POLICY_MISSING" && x.level === "fail")).toBe(true);
  });

  it("warns when classified complaint has no owner", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "in_review",
      hasClassificationReview: true,
      assignedOwnerUserId: null,
      daysOpen: 2,
      acknowledgeSlaDays: 5,
      complaintType: "ethical_conduct",
      routingDecision: "compliance_review",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: true,
    });
    expect(r.some((x) => x.code === "COMPLAINT_UNASSIGNED_AFTER_REVIEW")).toBe(true);
  });

  it("warns on aging before acknowledgement", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "new",
      hasClassificationReview: false,
      assignedOwnerUserId: null,
      daysOpen: 10,
      acknowledgeSlaDays: 5,
      complaintType: "service_issue",
      routingDecision: "internal_service",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: false,
    });
    expect(r.some((x) => x.code === "COMPLAINT_AGING_ACK_SLA")).toBe(true);
  });

  it("fails resolved without resolution note", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "resolved_internal",
      hasClassificationReview: true,
      assignedOwnerUserId: "u1",
      daysOpen: 3,
      acknowledgeSlaDays: 5,
      complaintType: "internal_service",
      routingDecision: "internal_service",
      resolutionNote: "  ",
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: true,
    });
    expect(r.some((x) => x.code === "COMPLAINT_RESOLUTION_NOTE_REQUIRED" && x.level === "fail")).toBe(true);
  });

  it("links false advertising to compliance follow-up warning", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "new",
      hasClassificationReview: false,
      assignedOwnerUserId: null,
      daysOpen: 1,
      acknowledgeSlaDays: 5,
      complaintType: "advertising_misleading",
      routingDecision: "compliance_review",
      resolutionNote: null,
      falseAdvertisingViolationLinked: true,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: false,
    });
    expect(r.some((x) => x.code === "COMPLAINT_LINK_COMPLIANCE_CASE")).toBe(true);
  });

  it("requires CAPA warning for repeated pattern", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "in_review",
      hasClassificationReview: true,
      assignedOwnerUserId: "u1",
      daysOpen: 2,
      acknowledgeSlaDays: 5,
      complaintType: "service_issue",
      routingDecision: "internal_service",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: true,
      consumerProtectionExplained: true,
    });
    expect(r.some((x) => x.code === "COMPLAINT_CAPA_REQUIRED_PATTERN")).toBe(true);
  });

  it("solo broker mode maps to self-managed compliance", () => {
    expect(getComplaintResponsibilityMode("solo_broker")).toBe("self_managed_compliance");
    expect(getComplaintResponsibilityMode("agency")).toBe("agency_managed_compliance");
  });

  it("warns when consumer protection explanation is missing for rights-confusion intakes", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: true,
      complaintStatus: "in_review",
      hasClassificationReview: true,
      assignedOwnerUserId: "u1",
      daysOpen: 1,
      acknowledgeSlaDays: 5,
      complaintType: "consumer_rights_confusion",
      routingDecision: "public_assistance",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: false,
    });
    expect(r.some((x) => x.code === "CONSUMER_PROTECTION_EXPLANATION_MISSING")).toBe(true);
  });

  it("solo brokers still fail governance when written policy is absent", () => {
    const r = evaluateComplaintGovernanceRules({
      hasWrittenComplaintPolicy: false,
      complaintStatus: "new",
      hasClassificationReview: false,
      assignedOwnerUserId: null,
      daysOpen: 0,
      acknowledgeSlaDays: 5,
      complaintType: "internal_service",
      routingDecision: "internal_service",
      resolutionNote: null,
      falseAdvertisingViolationLinked: false,
      repeatedComplaintPattern: false,
      consumerProtectionExplained: false,
    });
    expect(r.some((x) => x.code === "COMPLAINT_POLICY_MISSING")).toBe(true);
  });
});

describe("complaint routing heuristics", () => {
  it("ethical complaint suggests syndic path", () => {
    const cls = classifyComplaint({
      complaintType: "conduct_issue",
      description: "Broker misrepresented the property and refused syndic obligations",
    });
    const route = determineComplaintRoute(cls);
    expect(suggestSyndicReferral(route)).toBe("syndic");
  });

  it("consumer rights confusion suggests public assistance profile", () => {
    const cls = classifyComplaint({
      complaintType: "service_issue",
      description: "I am confused about my rights under the brokerage contract",
    });
    const route = determineComplaintRoute(cls);
    expect(route.suggestPublicAssistance).toBe(true);
    expect(route.consumerProtectionExplanation).toBe(true);
  });
});

describe("complaint aging", () => {
  it("computes days open", () => {
    const past = new Date(Date.now() - 3 * 86_400_000);
    const s = getComplaintAgingState(
      { id: "c1", firstReceivedAt: past, acknowledgedAt: null, status: "new" },
      5,
    );
    expect(s.daysOpen).toBeGreaterThanOrEqual(3);
    expect(s.overdueAcknowledgement).toBe(false);
  });
});
