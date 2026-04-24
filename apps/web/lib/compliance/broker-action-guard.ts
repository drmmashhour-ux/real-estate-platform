import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";
import { RegulatoryGuardService } from "./regulatory-guard.service";
import { EntityComplianceGuard } from "./entity-compliance-guard";
import { ComplianceLicenseService } from "./compliance-license.service";

/**
 * PHASE 2 & 4: BROKERAGE ACTION GUARD
 * Enforces that brokerage actions are tied to a verified broker and that the broker owns the entity.
 */
export class BrokerActionGuard {
  /**
   * Validates if the current user can perform a brokerage action on a specific entity.
   * Ensures the user is a verified broker, owns the entity, and is tied to a BROKERAGE entity.
   */
  static async validateBrokerageAction(params: {
    userId: string;
    action: "CREATE_LISTING" | "ACCEPT_OFFER" | "NEGOTIATE" | "EXECUTE_DEAL" | "REPRESENTATION_ACTION";
    entityId?: string;
    entityType?: "Listing" | "AmfCapitalDeal" | "Deal";
  }) {
    // 1. Entity Registry Check (Phase 5)
    const entityCheck = await EntityComplianceGuard.validateDomainAction({
      userId: params.userId,
      domain: "BROKERAGE",
      action: params.action === "REPRESENTATION_ACTION" ? "NEGOTIATE_DEAL" : params.action,
    });
    if (!entityCheck.allowed) {
      return { allowed: false, reason: entityCheck.reason };
    }

    // 2. License Validation (Phase 1 & 2)
    const licenseCheck = await ComplianceLicenseService.validateBrokerLicense(params.userId);
    if (!licenseCheck.valid) {
      return { allowed: false, reason: licenseCheck.reason || "User does not have a valid OACIQ license." };
    }

    // 3. Regulatory Check (Is verified broker in regulatory state)
    const regCheck = await RegulatoryGuardService.validateAction(params.userId, "CREATE_LISTING");
    if (!regCheck.allowed) {
      return { allowed: false, reason: "User is not a verified licensed broker in the regulatory state." };
    }

    // 4. Ownership Check (If entityId provided)
    if (params.entityId && params.entityType) {
      const isOwner = await this.checkOwnership(params.userId, params.entityId, params.entityType);
      if (!isOwner) {
        return { allowed: false, reason: `User does not have broker ownership of this ${params.entityType}.` };
      }
    }

    // 5. Audit Log (Phase 7)
    await logActivity({
      userId: params.userId,
      action: `brokerage_${params.action.toLowerCase()}`,
      entityType: params.entityType || "Brokerage",
      entityId: params.entityId || null,
      metadata: { 
        action: params.action,
        licenseNumber: licenseCheck.metadata?.licenseNumber 
      },
    });

    return { allowed: true };
  }

  private static async checkOwnership(userId: string, entityId: string, entityType: string): Promise<boolean> {
    switch (entityType) {
      case "Listing":
        const listing = await prisma.listing.findUnique({ where: { id: entityId }, select: { ownerId: true } });
        return listing?.ownerId === userId;
      case "AmfCapitalDeal":
        const amfDeal = await prisma.amfCapitalDeal.findUnique({ where: { id: entityId }, select: { sponsorUserId: true } });
        return amfDeal?.sponsorUserId === userId;
      default:
        return false;
    }
  }
}
