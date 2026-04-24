import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 6: AUDIT LOG [brokerage]
 * Centralized logging for all verified brokerage actions.
 */
export class BrokerageAuditService {
  static async logAction(params: {
    brokerId: string;
    action: string;
    dealId?: string;
    listingId?: string;
    metadata?: Record<string, any>;
  }) {
    await logActivity({
      userId: params.brokerId,
      action: `brokerage_${params.action}`,
      entityType: params.dealId ? "Deal" : "Listing",
      entityId: params.dealId || params.listingId || "brokerage_system",
      metadata: {
        ...params.metadata,
        brokerId: params.brokerId,
        dealId: params.dealId,
        listingId: params.listingId,
        platformRole: "BROKER",
        regulator: "OACIQ",
      },
    });
  }
}
