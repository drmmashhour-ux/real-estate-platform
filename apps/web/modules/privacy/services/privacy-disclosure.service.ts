import { prisma } from "@/lib/db";
import { PrivacyRedactionService } from "./privacy-redaction.service";
import { PrivacyPurpose } from "@prisma/client";

export class PrivacyDisclosureService {
  /**
   * Logs and handles external disclosure of information.
   */
  static async discloseData(args: {
    userId: string;
    transactionId: string;
    purpose: PrivacyPurpose;
    recipientType: 'CENTRIS' | 'BUYER_BROKER' | 'UNREPRESENTED_BUYER' | 'OTHER';
    recipientName: string;
    data: any;
  }) {
    // 1. Verify consent exists for this disclosure purpose
    const hasConsent = await prisma.consent.findFirst({
      where: {
        userId: args.userId,
        purpose: args.purpose,
        granted: true,
        revokedAt: null,
      },
    });

    if (!hasConsent) {
      throw new Error(`DISCLOSURE_BLOCKED: Explicit consent missing for ${args.purpose}`);
    }

    // 2. Redact data based on recipient
    let redactedData = { ...args.data };
    switch (args.recipientType) {
      case 'CENTRIS':
        redactedData = PrivacyRedactionService.redactForInformationDisseminationService(args.data);
        break;
      case 'BUYER_BROKER':
        redactedData = PrivacyRedactionService.redactForBuyerBroker(args.data);
        break;
      case 'UNREPRESENTED_BUYER':
        redactedData = PrivacyRedactionService.redactForUnrepresentedBuyer(args.data);
        break;
      default:
        // Default to maximum redaction if unknown recipient
        redactedData = PrivacyRedactionService.redactForUnrepresentedBuyer(args.data);
    }

    // 3. Log the disclosure in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: "EXTERNAL_DISCLOSURE",
        entityType: "Transaction",
        entityId: args.transactionId,
        purpose: args.purpose.toString(),
        metadata: {
          recipientType: args.recipientType,
          recipientName: args.recipientName,
          fieldsDisclosed: Object.keys(redactedData),
        },
      },
    });

    return redactedData;
  }

  /**
   * Specifically handles listing dissemination (Centris/etc).
   */
  static async discloseListingToService(listingId: string, sellerUserId: string) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new Error("Listing not found");

    return this.discloseData({
      userId: sellerUserId,
      transactionId: listing.id, // Using listingId as transaction context
      purpose: PrivacyPurpose.DISCLOSURE_TO_INFORMATION_DISSEMINATION_SERVICE,
      recipientType: 'CENTRIS',
      recipientName: 'Centris / MLS',
      data: listing,
    });
  }
}
