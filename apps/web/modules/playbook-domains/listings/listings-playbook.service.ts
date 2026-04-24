import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookAssignmentResult } from "@/modules/playbook-memory/types/playbook-memory.types";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";

/**
 * FSBO / listing save — optional LISTINGS-domain bandit assignment. Never throws.
 */
export async function tryListingsPlaybookAssignmentOnSave(input: {
  listingId: string;
  previousStatus: string;
  nextStatus: string;
  city?: string | null;
}): Promise<PlaybookAssignmentResult | null> {
  try {
    const wentLive =
      input.previousStatus === "DRAFT" &&
      (input.nextStatus === "ACTIVE" || input.nextStatus === "PENDING_VERIFICATION");
    try {
      playbookLog.info("listings_domain_module", { loaded: Boolean(getDomainModule("LISTINGS")) });
    } catch {
      playbookLog.info("listings_domain_module", { loaded: false });
    }
    return await playbookMemoryAssignmentService.assignBestOrManualFallback({
      domain: "LISTINGS",
      entityType: "fsbo_listing",
      entityId: input.listingId,
      market: { city: input.city?.trim() || undefined },
      segment: {
        source: "fsbo_listing_save",
        from: input.previousStatus,
        to: input.nextStatus,
        wentLive,
      },
      signals: {
        wentLive,
      },
    });
  } catch (e) {
    playbookLog.warn("listings_playbook_assign", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
