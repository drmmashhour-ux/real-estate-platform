import { prisma } from "@/lib/db";
import { LecipmRegulatoryAuditEntityType } from "@prisma/client";

/**
 * PHASE 4: AUDIT LOGGING
 * Specialized service for logging compliance-related events in the LECIPM ecosystem.
 */
export class ComplianceAuditService {
  /**
   * Logs a compliance event with full traceability.
   */
  static async logComplianceEvent(params: {
    userId?: string | null;
    entityType: LecipmRegulatoryAuditEntityType;
    entityId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }) {
    return await prisma.lecipmRegulatoryAuditLog.create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        metadataJson: params.metadata || {},
      },
    });
  }

  /**
   * Retrieves compliance audit logs for an entity.
   */
  static async getEntityAuditLogs(entityType: LecipmRegulatoryAuditEntityType, entityId: string) {
    return await prisma.lecipmRegulatoryAuditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
  }
}
