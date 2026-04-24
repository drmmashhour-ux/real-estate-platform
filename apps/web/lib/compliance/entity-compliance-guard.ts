import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export type SystemDomain = "BROKERAGE" | "FINANCIAL" | "PLATFORM";

const DOMAIN_ACTIONS: Record<SystemDomain, string[]> = {
  BROKERAGE: [
    "CREATE_LISTING",
    "PUBLISH_LISTING",
    "NEGOTIATE_DEAL",
    "ACCEPT_OFFER",
    "EXECUTE_DEAL",
    "MANAGE_PIPELINE",
    "CREATE_BROKERAGE_DOC",
    "CREATE_HANDOFF_PACKAGE",
    "VIEW_ANALYTICS",
  ],
  FINANCIAL: [
    "EVALUATE_OPPORTUNITY",
    "MANAGE_SIMULATED_ALLOCATION",
    "INVEST_SIMULATION",
    "INVEST_PRIVATE",
    "ONBOARD_INVESTOR",
    "REPORT_PERFORMANCE",
    "VIEW_DEAL_PACKET",
    "COMMIT_FUNDS",
    "MANAGE_ENTITIES",
    "MANAGE_INVESTORS",
    "INVEST_CAPITAL",
    "DISTRIBUTE_PROFITS",
    "MORTGAGE_BROKERAGE_EXECUTE",
    "MORTGAGE_LENDER_REFERRAL",
    "FINANCIAL_ADVICE",
    "FUND_MANAGEMENT",
    "VIEW_ANALYTICS",
    "GENERATE_ALLOCATION",
  ],
  PLATFORM: [
    "BROWSE_LISTINGS",
    "MANAGE_USER_PROFILE",
    "VIEW_ANALYTICS",
  ],
};

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
    // 0. Action-Domain Check (Part A.2)
    const allowedActions = DOMAIN_ACTIONS[params.domain];
    if (!allowedActions.includes(params.action)) {
      return { 
        allowed: false, 
        reason: `Action '${params.action}' is not valid for domain '${params.domain}'.` 
      };
    }

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

      case "FINANCIAL":
        // Must have role in a FINANCIAL entity (formerly FUND)
        const financialRole = userRoles.find(r => r.entity.type === "FINANCIAL" || r.entity.type === "FUND");
        if (financialRole) {
          allowed = true;
          targetEntityId = financialRole.entityId;
        } else {
          reason = "No valid role found in a FINANCIAL entity.";
        }
        break;

      case "PLATFORM":
        // Tech layer only - more permissive for now
        allowed = true;
        break;

      default:
        reason = "Unknown system domain.";
    }

    // 2. Block cross-entity execution (Part A.3)
    if (params.entityId && targetEntityId && params.entityId !== targetEntityId) {
      allowed = false;
      reason = `Action cross-entity mismatch. Required: ${targetEntityId}, Provided: ${params.entityId}`;
    }

    // 3. Audit Log (Part I)
    if (!allowed) {
      await logActivity({
        userId: params.userId,
        action: "cross_domain_action_blocked",
        entityType: "LegalEntity",
        entityId: targetEntityId || "platform",
        metadata: {
          domain: params.domain,
          action: params.action,
          reason,
          requestedEntityId: params.entityId,
        },
      });
    } else {
      await logActivity({
        userId: params.userId,
        action: `entity_${params.action.toLowerCase()}`,
        entityType: "LegalEntity",
        entityId: targetEntityId || "platform",
        metadata: {
          domain: params.domain,
          allowed,
          requestedEntityId: params.entityId,
        },
      });
    }

    return { allowed, reason, entityId: targetEntityId };
  }
}
