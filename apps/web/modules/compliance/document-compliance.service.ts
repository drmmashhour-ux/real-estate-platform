import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel } from "@prisma/client";

/**
 * Ensures secure document handling (EDM logic).
 * Immutable originals + Separate redacted versions.
 */
export class DocumentComplianceService {
  /**
   * Registers a new document with compliance metadata.
   */
  static async registerDocument(args: {
    transactionId: string;
    documentType: string;
    originalFileUrl: string;
    sensitivityLevel?: PrivacySensitivityLevel;
    allowedRoles?: string[];
  }) {
    return prisma.transactionDocument.create({
      data: {
        transactionId: args.transactionId,
        documentType: args.documentType,
        originalFileUrl: args.originalFileUrl,
        fileUrl: args.originalFileUrl, // Current active URL
        sensitivityLevel: args.sensitivityLevel || PrivacySensitivityLevel.CONFIDENTIAL,
        allowedRoles: args.allowedRoles || ["ADMIN", "BROKER"],
        isImmutable: true, // Originals must not be changed
        version: "1.0",
      }
    });
  }

  /**
   * Attaches a redacted version of an existing document.
   */
  static async attachRedactedVersion(args: {
    documentId: string;
    redactedFileUrl: string;
    redactedBy: string;
  }) {
    const doc = await prisma.transactionDocument.update({
      where: { id: args.documentId },
      data: {
        redactedFileUrl: args.redactedFileUrl,
      }
    });

    // Log redaction in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: args.redactedBy,
        action: "DOCUMENT_REDACTED",
        entityType: "TransactionDocument",
        entityId: args.documentId,
        purpose: "SAFE_DISCLOSURE",
        metadata: {
          originalUrl: doc.originalFileUrl,
          redactedUrl: args.redactedFileUrl,
        }
      }
    });

    return doc;
  }
}
