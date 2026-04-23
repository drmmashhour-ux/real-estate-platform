import { prisma } from "@/lib/db";
import { PrivacyConsentService } from "@/modules/compliance/consent.service";
import { redactSensitiveData, redactInspectionReport } from "@/lib/server/redaction";

export class BrokerageWorkflowService {
  /**
   * Retrieves visit access codes only if client has given explicit consent.
   * OACIQ Rule: Broker must be present if no consent is given.
   */
  static async getVisitAccessInfo(args: {
    listingId: string;
    brokerUserId: string;
  }) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: args.listingId },
      include: { property: { include: { owner: true } } },
    });

    if (!listing || !listing.property.owner) throw new Error("Listing owner not found");

    const ownerId = listing.property.owner.id;

    // Check for lockbox consent
    const hasLockboxConsent = await PrivacyConsentService.hasActiveConsent({
      userId: ownerId,
      purpose: "LOCKBOX_CODE_DISCLOSURE",
    });

    // Check for alarm consent
    const hasAlarmConsent = await PrivacyConsentService.hasActiveConsent({
      userId: ownerId,
      purpose: "ALARM_CODE_DISCLOSURE",
    });

    const result = {
      lockboxCode: hasLockboxConsent ? (listing as any).lockboxCode : "[CONSENT REQUIRED]",
      alarmCode: hasAlarmConsent ? (listing as any).alarmCode : "[CONSENT REQUIRED]",
      requiresBrokerAttendance: !hasLockboxConsent || !hasAlarmConsent,
    };

    // Log access attempt in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: args.brokerUserId,
        action: "VISIT_ACCESS_REQUEST",
        entityType: "Listing",
        entityId: args.listingId,
        metadata: {
          lockboxGranted: hasLockboxConsent,
          alarmGranted: hasAlarmConsent,
        },
      },
    });

    return result;
  }

  /**
   * Validates if sold price can be disclosed.
   * OACIQ Rule: Don't disclose before land register publication unless authorized.
   */
  static async canDiscloseSoldPrice(args: {
    listingId: string;
    targetUserId: string;
    targetUserRole: string;
  }) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: args.listingId },
    });

    if (!listing) throw new Error("Listing not found");

    const isPublishedInLandRegister = (listing as any).landRegisterPublishedAt != null;
    if (isPublishedInLandRegister) return true;

    const ownerId = (listing as any).ownerUserId;
    const hasConsent = await PrivacyConsentService.hasActiveConsent({
      userId: ownerId,
      purpose: "SOLD_PRICE_DISCLOSURE_TO_LICENSE_HOLDERS",
    });

    const isLicenseHolder = ["BROKER", "ADMIN", "SUPER_ADMIN"].includes(args.targetUserRole);
    return isLicenseHolder && hasConsent;
  }

  /**
   * Handles Seller Declaration (DS) access.
   * OACIQ: Not public, only brokers, signed page restricted.
   */
  static async getSellerDeclaration(args: {
    listingId: string;
    requestUserId: string;
    requestUserRole: string;
    isPublicRequest?: boolean;
  }) {
    if (args.isPublicRequest) {
      throw new Error("ACCESS_DENIED: Seller declarations are not public documents.");
    }

    const isAuthorized = ["BROKER", "ADMIN", "SUPER_ADMIN", "COMPLIANCE_STAFF"].includes(args.requestUserRole);
    if (!isAuthorized) {
      throw new Error("ACCESS_DENIED: Only brokers or authorized staff can access DS documents.");
    }

    const dsData = await prisma.transactionDocument.findFirst({
      where: { 
        transaction: { listingId: args.listingId },
        documentType: "seller_declaration" 
      }
    });

    if (!dsData) throw new Error("Seller declaration not found for this listing.");

    // Redact signatures and signed page for standard sharing
    const safeDs = redactSensitiveData(dsData);
    delete (safeDs as any).signedPage;

    return safeDs;
  }

  /**
   * Redacts inspection reports before sharing.
   */
  static async getRedactedInspectionReport(reportText: string) {
    return redactInspectionReport(reportText);
  }
}
