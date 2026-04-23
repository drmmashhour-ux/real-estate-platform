import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel, PrivacyRole as PrismaPrivacyRole } from "@prisma/client";

export enum PrivacyRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  LEGAL_ADMIN = "LEGAL_ADMIN",
  PRIVACY_OFFICER = "PRIVACY_OFFICER",
  AGENCY_EXECUTIVE = "AGENCY_EXECUTIVE",
  BROKER = "BROKER",
  SUPPORT_STAFF = "SUPPORT_STAFF",
  COMPLIANCE_STAFF = "COMPLIANCE_STAFF",
  MORTGAGE_STAFF = "MORTGAGE_STAFF",
  INVESTOR_STAFF = "INVESTOR_STAFF",
  HOST_STAFF = "HOST_STAFF",
  CLIENT = "CLIENT",
  UNREPRESENTED_BUYER = "UNREPRESENTED_BUYER",
  VISITOR = "VISITOR",
}

export class PrivacyAccessService {
  /**
   * Enforces "need to know" access control for documents.
   */
  static async canAccessDocument(args: {
    userId: string;
    userRole: string; // User.role or PrivacyRole
    documentId: string;
  }): Promise<boolean> {
    const doc = await prisma.lecipmSdDocument.findUnique({
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

    // 5. Default deny
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
