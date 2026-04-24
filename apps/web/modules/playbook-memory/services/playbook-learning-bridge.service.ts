import type { MemoryOutcomeStatus } from "@prisma/client";
import { playbookLog } from "../playbook-memory.logger";
import { assignmentLog } from "../playbook-learning-logger";
import { playbookMemoryAssignmentService } from "./playbook-memory-assignment.service";
import { tryCrmPlaybookAssignmentForInquiry } from "@/modules/playbook-domains/leads/crm-leads-playbook.service";

/**
 * Safe, additive hooks for: recommendation → assignment → outcome → learning.
 * Never throws from exported functions; inner async work is fire-and-forget where noted.
 */
async function applyTouchpointOutcomeSafe(p: {
    assignmentId: string;
    touchpoint: "listing_save" | "crm_inquiry" | "deal_create" | "deal_close";
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
  },

  /** After FSBO listing PATCH. Optional `playbookAssignmentId` in JSON body links Dream Home (or other) selection. */
  afterListingSave(input: { listingId: string; rawBody: unknown; previousStatus: string; data: unknown }): void {
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
        if (!aid) {
          return;
        }
        const d = input.data as { status?: string };
        const nextStatus =
          typeof d.status === "string" && d.status.trim() ? d.status : input.previousStatus;
        const goingLive =
          input.previousStatus === "DRAFT" && (nextStatus === "ACTIVE" || nextStatus === "PENDING_VERIFICATION");
        const status: MemoryOutcomeStatus = goingLive ? "PARTIAL" : "NEUTRAL";
        await this.applyTouchpointOutcomeSafe({
          assignmentId: aid,
          touchpoint: "listing_save",
          status,
          realizedConversion: goingLive ? 0.15 : 0.04,
        });
      } catch (e) {
        playbookLog.warn("learning_listing_save_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },

  /**
   * Wave 12 — allow CRM → Growth observability (no outbound automation; logging only).
   */
  logCrossDomainCrmToGrowth(leadId: string): void {
    try {
      playbookLog.info("learning_wave12", { from: "LEADS", to: "GROWTH", leadId });
    } catch {
      /* */
    }
  },

  /**
   * After CRM / buyer inquiry creates a `Lead` row. Creates optional LEADS assignment and applies a partial touchpoint.
   */
  afterCrmInquiryLead(input: {
    leadId: string;
    city?: string | null;
    listingId?: string | null;
    leadSource?: string | null;
  }): void {
    void (async () => {
      try {
        this.logCrossDomainCrmToGrowth(input.leadId);
        const assigned = await tryCrmPlaybookAssignmentForInquiry({
          id: input.leadId,
          city: input.city,
          listingId: input.listingId,
          leadSource: input.leadSource,
        });
        if (assigned?.assignmentId) {
          await this.applyTouchpointOutcomeSafe({
            assignmentId: assigned.assignmentId,
            touchpoint: "crm_inquiry",
            status: "PARTIAL",
            realizedConversion: 0.12,
          });
        }
      } catch (e) {
        playbookLog.warn("learning_crm_inquiry_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },

  afterDealCreated(input: { dealId: string; playbookAssignmentId: string | null }): void {
    void (async () => {
      if (!input.playbookAssignmentId?.trim()) {
        return;
      }
      try {
        await this.applyTouchpointOutcomeSafe({
          assignmentId: input.playbookAssignmentId.trim(),
          touchpoint: "deal_create",
          status: "PARTIAL",
          realizedConversion: 0.18,
        });
      } catch (e) {
        playbookLog.warn("learning_deal_create_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },

  afterDealClosingComplete(input: { dealId: string; playbookAssignmentId: string | null }): void {
    void (async () => {
      if (!input.playbookAssignmentId?.trim()) {
        return;
      }
      try {
        await this.applyTouchpointOutcomeSafe({
          assignmentId: input.playbookAssignmentId.trim(),
          touchpoint: "deal_close",
          status: "SUCCEEDED",
          realizedConversion: 1,
        });
      } catch (e) {
        playbookLog.warn("learning_deal_close_failed", { message: e instanceof Error ? e.message : String(e) });
      }
    })();
  },
};
