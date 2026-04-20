import { prisma } from "@/lib/db";
import {
  getComplianceStatus,
  ensureCoOwnershipChecklist,
} from "@/services/compliance/coownershipCompliance.service";
import { createNotification } from "@/modules/notifications/services/create-notification";
import type { LecipmCoreAutopilotExecutionMode } from "@/src/modules/autopilot/types";
import type { CoownershipComplianceAutopilotDecision } from "@/src/modules/autopilot/rules/coownershipCompliance.rule";
import {
  recordCoownershipBlocked,
  recordCoownershipChecklistEnsured,
  recordCoownershipWarning,
} from "@/src/modules/autopilot/monitoring/coownership-autopilot-monitoring.service";

export type CoownershipExecutorResult = {
  checklistEnsured: boolean;
  recommendationSent: boolean;
  blockRecorded: boolean;
};

/**
 * Runs side effects for a co-ownership compliance decision (mode-aware).
 * Does not duplicate checklist rows — `ensureCoOwnershipChecklist` is idempotent.
 */
export async function executeCoownershipComplianceDecision(input: {
  listingId: string;
  ownerUserId: string | null;
  mode: LecipmCoreAutopilotExecutionMode;
  decision: CoownershipComplianceAutopilotDecision;
}): Promise<CoownershipExecutorResult> {
  const { listingId, ownerUserId, mode, decision } = input;
  let checklistEnsured = false;
  let recommendationSent = false;
  let blockRecorded = false;

  const hasChecklistEnsure = decision.actions.some((a) => a.type === "CHECKLIST_ENSURE");
  const recommendation = decision.actions.find((a) => a.type === "RECOMMENDATION");
  const block = decision.actions.find((a) => a.type === "BLOCK_ACTION");

  if (mode === "ASSIST") {
    if (recommendation) {
      recordCoownershipWarning(listingId);
      if (ownerUserId) {
        await createNotification({
          userId: ownerUserId,
          type: "REMINDER",
          title: "Co-ownership compliance",
          message: recommendation.payload.message,
          priority: "NORMAL",
          listingId,
          skipIfDuplicateUnread: true,
          metadata: { source: "lecipm_coownership_autopilot", listingId },
        });
        recommendationSent = true;
      }
    }
    return { checklistEnsured: false, recommendationSent, blockRecorded: false };
  }

  if (hasChecklistEnsure && (mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT_APPROVAL")) {
    await ensureCoOwnershipChecklist(listingId);
    checklistEnsured = true;
    recordCoownershipChecklistEnsured(listingId);
  }

  if (recommendation && mode !== "OFF") {
    recordCoownershipWarning(listingId);
    if (ownerUserId) {
      await createNotification({
        userId: ownerUserId,
        type: "REMINDER",
        title: "Co-ownership compliance",
        message: recommendation.payload.message,
        priority: decision.severity === "critical" ? "HIGH" : "NORMAL",
        listingId,
        skipIfDuplicateUnread: true,
        metadata: { source: "lecipm_coownership_autopilot", listingId },
      });
      recommendationSent = true;
    }
  }

  if (block && mode === "FULL_AUTOPILOT_APPROVAL") {
    recordCoownershipBlocked(listingId, block.payload.reason);
    blockRecorded = true;
    if (ownerUserId) {
      await createNotification({
        userId: ownerUserId,
        type: "SYSTEM",
        title: "Listing blocked — co-ownership certificate",
        message: block.payload.reason,
        priority: "HIGH",
        listingId,
        skipIfDuplicateUnread: true,
        metadata: { source: "lecipm_coownership_autopilot_block", listingId },
      });
    }
  }

  return { checklistEnsured, recommendationSent, blockRecorded };
}

export async function loadListingForCoownershipPipeline(listingId: string) {
  return prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      listingType: true,
      isCoOwnership: true,
      ownerId: true,
    },
  });
}

export async function getCertificateCompleteForListing(listingId: string): Promise<boolean> {
  const s = await getComplianceStatus(listingId);
  return s.certificateComplete;
}
