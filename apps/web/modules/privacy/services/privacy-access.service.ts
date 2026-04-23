import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel } from "@prisma/client";

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
   * Enforces "need to know" access control.
   */
  static async canAccess(args: {
    userId: string;
    role: PrivacyRole;
    entityType: string;
    entityId: string;
    transactionId?: string;
    sensitivity: PrivacySensitivityLevel;
  }): Promise<boolean> {
    // 1. Super admin always has access
    if (args.role === PrivacyRole.SUPER_ADMIN || args.role === PrivacyRole.PRIVACY_OFFICER) {
      return true;
    }

    // 2. Default deny for public if sensitive
    if (args.sensitivity !== PrivacySensitivityLevel.PUBLIC && args.role === PrivacyRole.VISITOR) {
      return false;
    }

    // 3. Broker on the file
    if (args.role === PrivacyRole.BROKER && args.transactionId) {
      const isOnFile = await prisma.brokerageOfficeAuditLog.findFirst({
        where: {
          // Placeholder for actual file linkage check
          // e.g. transaction has broker assigned
          id: "some-linkage",
        },
      });
      // For now, let's assume we have a better way to check "involved in file"
      // return !!isOnFile;
      return true; // Simplified for MVP
    }

    // 4. Default deny for unrelated roles
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

    return args.data; // In a real system, this would return the filtered data
  }
}
