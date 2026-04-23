import { prisma } from "@/lib/db";
import { PrivacyRedactionService } from "./privacy-redaction.service";
import { PrivacyAuditLog } from "@prisma/client";

export class PrivacyDisclosureService {
  /**
   * Discloses a document to an external recipient with optional redaction.
   */
  static async discloseDocument(args: {
    documentId: string;
    recipient: string;
    purpose: string;
    actorUserId: string;
    redact: boolean;
  }) {
    const doc = await prisma.lecipmSdDocument.findUnique({
      where: { id: args.documentId },
    });

    if (!doc) throw new Error("Document not found");

    let finalContent = doc.bodyHtml || "";
    if (args.redact) {
      finalContent = PrivacyRedactionService.redactInspectionReport(finalContent);
      // In a real system, we'd generate a new PDF or file with redactions applied.
    }

    // Log the disclosure
    await prisma.privacyAuditLog.create({
      data: {
        userId: args.actorUserId,
        action: "EXTERNAL_DISCLOSURE",
        entityType: "LecipmSdDocument",
        entityId: args.documentId,
        purpose: args.purpose,
        metadata: {
          recipient: args.recipient,
          redacted: args.redact,
        },
      },
    });

    return {
      success: true,
      content: finalContent,
      message: `Document disclosed to ${args.recipient} for ${args.purpose}.`,
    };
  }
}
