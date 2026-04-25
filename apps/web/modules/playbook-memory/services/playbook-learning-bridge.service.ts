import type { MemoryOutcomeStatus } from "@prisma/client";
import type { PlaybookAssignmentResult } from "../types/playbook-memory.types";
import { playbookLog } from "../playbook-memory.logger";
import { assignmentLog, banditLog, crmLearningLog, dreamHomeLearningLog } from "../playbook-learning-logger";
import { playbookMemoryAssignmentService } from "./playbook-memory-assignment.service";
import { tryCrmPlaybookAssignmentForInquiry } from "@/modules/playbook-domains/leads/crm-leads-playbook.service";
import { tryListingsPlaybookAssignmentOnSave } from "@/modules/playbook-domains/listings/listings-playbook.service";
import { evaluateCrossDomainTransfer, logCrossDomainCrmToGrowthSafe } from "@/modules/playbook-domains/shared/cross-domain-policy";

async function applyTouchpointOutcomeSafe(p: {
  assignmentId: string;
  touchpoint:
    | "listing_save"
    | "crm_inquiry"
    | "deal_create"
    | "deal_close"
    | "deal_lost"
    | "dream_home_match";
  status: MemoryOutcomeStatus;
  realizedConversion?: number | null;
}): Promise<void> {
  try {
    assignmentLog.info("touchpoint_outcome", {
      assignmentId: p.assignmentId,
      touchpoint: p.touchpoint,
      status: p.status,
    });
    await playbookMemoryAssignmentService.attachAssignmentOutcome({
      assignmentId: p.assignmentId,
      memoryRecordId: null,
      outcomeStatus: p.status,
      realizedConversion: p.realizedConversion ?? null,
    });
  } catch (e) {
    assignmentLog.warn("touchpoint_skipped", { message: e instanceof Error ? e.message : String(e) });
  }
}

function logCrossDomainCrmToGrowth(leadId: string): void {
  logCrossDomainCrmToGrowthSafe(leadId);
}

/**
 * Safe, additive hooks for: recommendation → assignment → outcome → learning.
 * Never throws from exported functions; inner async work is fire-and-forget.
 */
export const playbookLearningBridge = {
  logCrossDomainCrmToGrowth,

  /**
   * After Dream Home match: logs assignment vs deterministic fallback, cross-domain intent (no auto execution).
   */
  afterDreamHomeMatch(input: {
    assignment: PlaybookAssignmentResult | null;
    /** For observability / future LISTINGS bridge */
    segment: Record<string, unknown>;
  }): void {
    void (async () => {
      try {
        playbookLog.info("learning_dream_home_match", { hasAssignment: Boolean(input.assignment) });
        const cd = evaluateCrossDomainTransfer("DREAM_HOME", "LISTINGS");
        dreamHomeLearningLog.info("match_complete", {
          hasAssignment: Boolean(input.assignment?.assignmentId),
          crossDomainToListings: cd.allowed,
          rationale: cd.rationale,
        });
        if (input.assignment?.assignmentId) {
          assignmentLog.info("dream_home_context", { assignmentId: input.assignment.assignmentId });
          try {
            playbookLog.info("learning_cross_domain", {
              from: "DREAM_HOME",
              to: "LISTINGS",
              allowed: cd.allowed,
              rationale: cd.rationale,
            });
          } catch {
            /* */
          }
          await applyTouchpointOutcomeSafe({
            assignmentId: input.assignment.assignmentId,
            touchpoint: "dream_home_match",
            status: "PARTIAL",
            realizedConversion: 0.07,
          });
        } else {
          banditLog.info("fallback_deterministic", { domain: "DREAM_HOME", reason: "no_bandit_assignment" });
          playbookLog.info("learning_fallback", { domain: "DREAM_HOME" });
        }
      } catch (e) {
        playbookLog.warn("learning_dream_home_match_failed", {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  },

  /**
   * After FSBO listing PATCH. Optional `playbookAssignmentId` in JSON body links a prior selection.
   * If absent, an optional LISTINGS assignment is created server-side, then a touchpoint is applied when possible.
   */
  afterListingSave(input: { listingId: string; rawBody: unknown; previousStatus: string; data: unknown; city?: string | null }): void {
    void (async () => {
      try {
        playbookLog.info("learning_listing_save", {
          listingId: input.listingId,
          prev: input.previousStatus,
        });
        const b =
          input.rawBody && typeof input.rawBody === "object" && !Array.isArray(input.rawBody)
            ? (input.rawBody as Record<string, unknown>)
            : {};
        const aid = typeof b.playbookAssignmentId === "string" ? b.playbookAssignmentId.trim() : "";
        const d = input.data as { status?: string };
        const nextStatus =
          typeof d.status === "string" && d.status.trim() ? d.status : input.previousStatus;
        const goingLive =
          input.previousStatus === "DRAFT" && (nextStatus === "ACTIVE" || nextStatus === "PENDING_VERIFICATION");
        const status: MemoryOutcomeStatus = goingLive ? "PARTIAL" : "NEUTRAL";
        const conversion = goingLive ? 0.15 : 0.04;

        if (aid) {
          await applyTouchpointOutcomeSafe({
            assignmentId: aid,
            touchpoint: "listing_save",
            status,
            realizedConversion: conversion,
          });
          return;
        }

        const materialTransition =
          input.previousStatus !== nextStatus ||
          (input.previousStatus === "DRAFT" && (nextStatus === "ACTIVE" || nextStatus === "PENDING_VERIFICATION"));
        if (!materialTransition) {
          return;
        }

        const auto = await tryListingsPlaybookAssignmentOnSave({
          listingId: input.listingId,
          previousStatus: input.previousStatus,
          nextStatus,
          city: input.city,
        });
        if (auto?.assignmentId) {
          assignmentLog.info("listing_save_auto_assigned", { assignmentId: auto.assignmentId });
          await applyTouchpointOutcomeSafe({
            assignmentId: auto.assignmentId,
            touchpoint: "listing_save",
            status,
            realizedConversion: conversion,
          });
        } else {
          banditLog.info("fallback_deterministic", { domain: "LISTINGS", reason: "no_bandit_assignment_listing" });
          playbookLog.info("learning_fallback", { domain: "LISTINGS" });
        }
      } catch (e) {
        playbookLog.warn("learning_listing_save_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },

  afterCrmInquiryLead(input: { leadId: string; city?: string | null; listingId?: string | null; leadSource?: string | null }): void {
    void (async () => {
      try {
        logCrossDomainCrmToGrowth(input.leadId);
        crmLearningLog.info("inquiry_touchpoint", {
          leadId: input.leadId,
          hasListing: Boolean(input.listingId),
        });
        const assigned = await tryCrmPlaybookAssignmentForInquiry({
          id: input.leadId,
          city: input.city,
          listingId: input.listingId,
          leadSource: input.leadSource,
        });
        if (assigned?.assignmentId) {
          await applyTouchpointOutcomeSafe({
            assignmentId: assigned.assignmentId,
            touchpoint: "crm_inquiry",
            status: "PARTIAL",
            realizedConversion: 0.12,
          });
        } else {
          banditLog.info("fallback_deterministic", { domain: "LEADS", reason: "no_bandit_assignment_inquiry" });
          playbookLog.info("learning_fallback", { domain: "LEADS", touch: "crm_inquiry" });
        }
      } catch (e) {
        playbookLog.warn("learning_crm_inquiry_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },

  afterDealCreated(input: { dealId: string; playbookAssignmentId: string | null }): void {
    void (async () => {
      if (input.playbookAssignmentId?.trim()) {
        try {
          await applyTouchpointOutcomeSafe({
            assignmentId: input.playbookAssignmentId.trim(),
            touchpoint: "deal_create",
            status: "PARTIAL",
            realizedConversion: 0.18,
          });
        } catch (e) {
          playbookLog.warn("learning_deal_create_failed", { message: e instanceof Error ? e.message : String(e) });
        }
        return;
      }
      try {
        banditLog.info("fallback_deterministic", { domain: "DEALS", reason: "no_playbook_assignment_id" });
        playbookLog.info("learning_fallback", { domain: "DEALS", touch: "deal_create" });
      } catch {
        /* */
      }
    })();
  },

  afterDealClosingComplete(input: { dealId: string; playbookAssignmentId: string | null }): void {
    void (async () => {
      if (input.playbookAssignmentId?.trim()) {
        try {
          await applyTouchpointOutcomeSafe({
            assignmentId: input.playbookAssignmentId.trim(),
            touchpoint: "deal_close",
            status: "SUCCEEDED",
            realizedConversion: 1,
          });
        } catch (e) {
          playbookLog.warn("learning_deal_close_failed", { message: e instanceof Error ? e.message : String(e) });
        }
        return;
      }
      try {
        banditLog.info("fallback_deterministic", { domain: "DEALS", reason: "no_playbook_assignment_id_close" });
        playbookLog.info("learning_fallback", { domain: "DEALS", touch: "deal_close" });
      } catch {
        /* */
      }
    })();
  },

  /**
   * Deal cancelled or CRM marked lost — bounded negative signal for bandit (FAILED + low conversion hint).
   */
  afterDealClosedLost(input: { dealId: string; playbookAssignmentId: string | null; reason: "cancelled" | "crm_lost" }): void {
    void (async () => {
      if (input.playbookAssignmentId?.trim()) {
        try {
          await applyTouchpointOutcomeSafe({
            assignmentId: input.playbookAssignmentId.trim(),
            touchpoint: "deal_lost",
            status: "FAILED",
            realizedConversion: input.reason === "crm_lost" ? 0 : 0.08,
          });
        } catch (e) {
          playbookLog.warn("learning_deal_lost_failed", { message: e instanceof Error ? e.message : String(e) });
        }
        return;
      }
      try {
        banditLog.info("fallback_deterministic", {
          domain: "DEALS",
          reason: "no_playbook_assignment_id_lost",
          lostReason: input.reason,
        });
        playbookLog.info("learning_fallback", { domain: "DEALS", touch: "deal_lost", reason: input.reason });
      } catch {
        /* */
      }
    })();
  },

  /** After broker CRM autopilot evaluates a lead (assignment is audit-only; no auto messaging). */
  afterBrokerLeadAutopilotEvaluate(input: {
    leadId: string;
    assignment: PlaybookAssignmentResult | null;
  }): void {
    void (async () => {
      try {
        playbookLog.info("learning_broker_lead_evaluate", {
          leadId: input.leadId,
          assignmentId: input.assignment?.assignmentId ?? null,
        });
        crmLearningLog.info("autopilot_evaluate_bridge", {
          leadId: input.leadId,
          assignmentId: input.assignment?.assignmentId ?? null,
        });
        if (input.assignment?.assignmentId) {
          assignmentLog.info("broker_lead_wave9", {
            assignmentId: input.assignment.assignmentId,
            entityType: "broker_lead",
          });
        }
      } catch (e) {
        playbookLog.warn("learning_broker_lead_evaluate_failed", {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  },
};
