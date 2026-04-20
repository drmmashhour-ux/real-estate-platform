import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import {
  evaluateCoownershipComplianceRule,
  listingMatchesCoownershipRule,
} from "@/src/modules/autopilot/rules/coownershipCompliance.rule";
import {
  executeCoownershipComplianceDecision,
  getCertificateCompleteForListing,
  getCriticalComplianceCompleteForListing,
  getInsuranceGateCompleteForListing,
  loadListingForCoownershipPipeline,
} from "@/src/modules/autopilot/executor/coownership-compliance.executor";
import { recordCoownershipCheckTriggered } from "@/src/modules/autopilot/monitoring/coownership-autopilot-monitoring.service";
import type { LecipmCoreAutopilotExecutionMode } from "@/src/modules/autopilot/types";
import { actionRequiresApproval } from "@/src/modules/autopilot/policies/approval.policy";

const TRIGGER_EVENTS = new Set(["listing_created", "listing_updated", "scheduled_scan"]);

export async function runCoownershipCompliancePipeline(input: {
  runId: string;
  listingId: string;
  mode: LecipmCoreAutopilotExecutionMode;
  eventType: string;
}): Promise<{ actionsCreated: number; matched: boolean }> {
  const { runId, listingId, mode, eventType } = input;

  if (!TRIGGER_EVENTS.has(eventType) || mode === "OFF") {
    return { actionsCreated: 0, matched: false };
  }

  const listing = await loadListingForCoownershipPipeline(listingId);
  if (!listing) {
    return { actionsCreated: 0, matched: false };
  }

  if (
    !listingMatchesCoownershipRule({
      listingType: listing.listingType,
      isCoOwnership: listing.isCoOwnership,
    })
  ) {
    return { actionsCreated: 0, matched: false };
  }

  recordCoownershipCheckTriggered(listingId);

  const [certificateComplete, insuranceGateComplete, criticalComplianceComplete] = await Promise.all([
    getCertificateCompleteForListing(listingId),
    getInsuranceGateCompleteForListing(listingId),
    getCriticalComplianceCompleteForListing(listingId),
  ]);

  const decision = evaluateCoownershipComplianceRule({
    listing: { listingType: listing.listingType, isCoOwnership: listing.isCoOwnership },
    mode,
    certificateComplete,
    insuranceGateComplete,
    criticalComplianceComplete,
  });

  if (!decision) {
    await prisma.lecipmCoreAutopilotRuleLog.create({
      data: {
        runId,
        ruleKey: "coownership_compliance_skip",
        matched: false,
        detailJson: asInputJsonValue({ listingId, reason: "not_applicable_or_mode" }),
      },
    });
    return { actionsCreated: 0, matched: false };
  }

  await prisma.lecipmCoreAutopilotRuleLog.create({
    data: {
      runId,
      ruleKey: "coownership_compliance_québec_2025",
      matched: true,
      detailJson: asInputJsonValue({ listingId, severity: decision.severity }),
    },
  });

  const exec = await executeCoownershipComplianceDecision({
    listingId,
    ownerUserId: listing.ownerId,
    mode,
    decision,
  });

  const actionType = "coownership_compliance_bundle";
  const requires = actionRequiresApproval(actionType) || mode === "FULL_AUTOPILOT_APPROVAL";

  const descriptionParts = [
    exec.checklistEnsured ? "Checklist rows ensured." : null,
    exec.recommendationSent ? "Recommendation delivered (in-app)." : null,
    exec.blockRecorded ? "Blocking rule active until certificate is complete." : null,
  ].filter(Boolean);

  await prisma.lecipmCoreAutopilotAction.create({
    data: {
      runId,
      type: actionType,
      domain: "COOWNERSHIP_COMPLIANCE",
      severity: decision.severity,
      riskLevel: decision.severity === "critical" ? "high" : "medium",
      targetType: "listing",
      targetId: listingId,
      title: "Co-ownership compliance",
      description:
        descriptionParts.join(" ") ||
        "Co-ownership compliance scan completed (Québec Reg. 2025).",
      payloadJson: asInputJsonValue({
        domain: decision.domain,
        listingId,
        decision,
        executor: exec,
        eventType,
      }),
      status: "pending",
      requiresApproval: requires,
    },
  });

  return { actionsCreated: 1, matched: true };
}
