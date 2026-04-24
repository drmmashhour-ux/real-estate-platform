import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export type SystemDomain = "BROKERAGE" | "FUND" | "PLATFORM";

/**
 * PHASE 5: COMPLIANCE GUARD
 * Enforces legal separation between Brokerage and Fund activities.
 */
export class EntityComplianceGuard {
  /**
   * Validates if a user can perform an action within a specific domain
   * and ensures it's tied to the correct legal entity.
   */
  static async validateDomainAction(params: {
    userId: string;
    domain: SystemDomain;
    action: string;
    entityId?: string; // Optional: specific entity if known
  }) {
    // 1. Get User roles and their entities
    const userRoles = await prisma.lecipmUserEntityRole.findMany({
      where: { userId: params.userId },
      include: { entity: true }
    });

    let allowed = false;
    let targetEntityId: string | null = null;
    let reason = "";

    switch (params.domain) {
      case "BROKERAGE":
        // Must have role in a BROKERAGE entity
        const brokerageRole = userRoles.find(r => r.entity.type === "BROKERAGE");
        if (brokerageRole) {
          allowed = true;
          targetEntityId = brokerageRole.entityId;
        } else {
          reason = "No valid role found in a BROKERAGE entity.";
        }
        break;

      case "FUND":
        // Must have role in a FUND entity
        const fundRole = userRoles.find(r => r.entity.type === "FUND");
        if (fundRole) {
          allowed = true;
          targetEntityId = fundRole.entityId;
        } else {
          reason = "No valid role found in a FUND entity.";
        }
        break;

      case "PLATFORM":
        // Tech layer only - more permissive for now
        allowed = true;
        break;

      default:
        reason = "Unknown system domain.";
    }

    // 2. Block cross-entity execution
    if (params.entityId && targetEntityId && params.entityId !== targetEntityId) {
      allowed = false;
      reason = `Action cross-entity mismatch. Required: ${targetEntityId}, Provided: ${params.entityId}`;
    }

    // 3. Audit Log (Phase 6)
    await logActivity({
      userId: params.userId,
      action: `entity_${params.action.toLowerCase()}`,
      entityType: "LegalEntity",
      entityId: targetEntityId || "platform",
      metadata: {
        domain: params.domain,
        allowed,
        reason,
        requestedEntityId: params.entityId,
      },
    });

    return { allowed, reason, entityId: targetEntityId };
  }
}
