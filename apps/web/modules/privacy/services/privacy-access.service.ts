import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel, PlatformRole } from "@prisma/client";
import { canAccess } from "@/lib/server/access-control";

export const PrivacyRole = PlatformRole;

export class PrivacyAccessService {
  /**
   * Enforces "need to know" access control for documents.
   */
  static async canAccessDocument(args: {
    userId: string;
    userRole: string;
    documentId: string;
  }): Promise<boolean> {
    const doc = await prisma.transactionDocument.findUnique({
      where: { id: args.documentId },
      include: { transaction: { select: { brokerId: true, buyerId: true, sellerId: true } } },
    });

    if (!doc) return false;

    // Use centralized access control logic
    return canAccess(
      { id: args.userId, role: args.userRole },
      { 
        type: "DOCUMENT", 
        ownerId: doc.transaction.buyerId, // Simplified for now
        brokerId: doc.transaction.brokerId || undefined,
        allowedRoles: doc.allowedRoles as string[] || [],
        sensitivityLevel: doc.sensitivityLevel
      }
    );
  }

  /**
   * Logs and validates interdepartmental transfers.
   */
  static async transferData(args: {
    transactionId: string;
    fromDepartment: string;
    toDepartment: string;
    initiatedBy: string;
    purpose: string;
    data: any;
    redact?: boolean;
  }) {
    if (!args.purpose) throw new Error("Transfer purpose required");

    // Log transfer in compliance register
    await prisma.privacyTransferLog.create({
      data: {
        transactionId: args.transactionId,
        fromDepartment: args.fromDepartment,
        toDepartment: args.toDepartment,
        initiatedBy: args.initiatedBy,
        purpose: args.purpose,
        fieldsTransferred: Object.keys(args.data),
        redacted: args.redact ?? true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: args.initiatedBy,
        action: "INTERNAL_TRANSFER",
        entityType: "Transaction",
        entityId: args.transactionId,
        purpose: args.purpose,
        metadata: {
          from: args.fromDepartment,
          to: args.toDepartment,
        },
      },
    });

    return args.data;
  }
}
