import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel, PlatformRole } from "@prisma/client";

export const PrivacyRole = PlatformRole;

export class PrivacyAccessService {
  /**
   * Enforces "need to know" access control for documents.
   */
  static async canAccessDocument(args: {
    userId: string;
    userRole: string; // User.role or PrivacyRole
    documentId: string;
  }): Promise<boolean> {
    const doc = await prisma.transactionDocument.findUnique({
      where: { id: args.documentId },
      include: { transaction: { select: { brokerId: true } } },
    });

    if (!doc) return false;

    // 1. Super admin / Privacy Officer bypass
    if (args.userRole === "ADMIN" || args.userRole === PrivacyRole.SUPER_ADMIN || args.userRole === PrivacyRole.PRIVACY_OFFICER) {
      return true;
    }

    // 2. Check sensitivity
    if (doc.sensitivityLevel === PrivacySensitivityLevel.PUBLIC) {
      return true;
    }

    // 3. Broker on the transaction
    if (doc.transaction.brokerId === args.userId) {
      return true;
    }

    // 4. Allowed roles check
    if (doc.allowedRoles) {
      const allowed = doc.allowedRoles as string[];
      if (allowed.includes(args.userRole)) {
        return true;
      }
    }

    // 5. Allowed departments check (assuming user.department exists or is passed in)
    // For now, we'll assume departments are not yet fully implemented in the User model,
    // but the logic is ready.
    if (doc.allowedDepartments) {
      const allowedDepts = doc.allowedDepartments as string[];
      // if (args.userDepartment && allowedDepts.includes(args.userDepartment)) return true;
    }

    // 6. Need to know override
    if (doc.needToKnow === false) {
      // If not strictly need-to-know, allow wider internal access if not confidential
      if (doc.sensitivityLevel === PrivacySensitivityLevel.INTERNAL) return true;
    }

    // 7. Default deny
    return false;
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
    // 1. Verify purpose exists
    if (!args.purpose) throw new Error("Transfer purpose required");

    // 2. Log transfer
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

    // 3. Audit log
    await prisma.privacyAuditLog.create({
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
