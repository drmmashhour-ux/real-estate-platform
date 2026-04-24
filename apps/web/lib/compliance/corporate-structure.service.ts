import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export type EntityType = "SPV" | "HOLDCO" | "LP" | "CORP";
export type MemberRole = "SHAREHOLDER" | "DIRECTOR" | "OFFICER" | "SECRETARY";

/**
 * Service to manage legally scalable corporate structures.
 * Supports hierarchies (Parent-Child) and complex ownership.
 */
export class CorporateStructureService {
  /**
   * Creates a new corporate entity.
   */
  static async createEntity(params: {
    legalName: string;
    entityType: EntityType;
    registrationNumber?: string;
    jurisdiction?: string;
    parentId?: string;
    capitalDealId?: string;
  }) {
    const entity = await prisma.lecipmCorporateEntity.create({
      data: {
        legalName: params.legalName,
        entityType: params.entityType,
        registrationNumber: params.registrationNumber,
        jurisdiction: params.jurisdiction || "QC",
        parentId: params.parentId,
        capitalDealId: params.capitalDealId,
      },
    });

    await logActivity({
      action: "corporate_entity_created",
      entityType: "LecipmCorporateEntity",
      entityId: entity.id,
      metadata: { 
        legalName: params.legalName, 
        entityType: params.entityType,
        parentId: params.parentId 
      },
    });

    return entity;
  }

  /**
   * Adds a member (Director/Shareholder) to an entity.
   */
  static async addMember(params: {
    entityId: string;
    userId: string;
    role: MemberRole;
    equityPercentage?: number;
    votingPower?: number;
  }) {
    const member = await prisma.lecipmEntityMember.create({
      data: {
        entityId: params.entityId,
        userId: params.userId,
        role: params.role,
        equityPercentage: params.equityPercentage,
        votingPower: params.votingPower,
      },
    });

    await logActivity({
      userId: params.userId,
      action: "entity_member_added",
      entityType: "LecipmCorporateEntity",
      entityId: params.entityId,
      metadata: { role: params.role, equityPercentage: params.equityPercentage },
    });

    return member;
  }

  /**
   * Attaches a legal document to an entity.
   */
  static async attachDocument(params: {
    entityId: string;
    docType: string;
    title: string;
    storageUrl: string;
  }) {
    const doc = await prisma.lecipmEntityDocument.create({
      data: {
        entityId: params.entityId,
        docType: params.docType,
        title: params.title,
        storageUrl: params.storageUrl,
      },
    });

    await logActivity({
      action: "entity_document_attached",
      entityType: "LecipmCorporateEntity",
      entityId: params.entityId,
      metadata: { docType: params.docType, title: params.title },
    });

    return doc;
  }

  /**
   * Retrieves the full ownership tree for an entity.
   */
  static async getOwnershipTree(entityId: string) {
    return prisma.lecipmCorporateEntity.findUnique({
      where: { id: entityId },
      include: {
        parent: true,
        children: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        documents: true,
      }
    });
  }
}
