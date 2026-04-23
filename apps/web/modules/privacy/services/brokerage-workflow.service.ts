import { prisma } from "@/lib/db";
import { PrivacyPurpose } from "@prisma/client";
import { PrivacyConsentService } from "./privacy-consent.service";

export class BrokerageWorkflowService {
  /**
   * Retrieves visit access codes only if client has given explicit consent.
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
      purpose: PrivacyPurpose.LOCKBOX_CODE_DISCLOSURE,
    });

    // Check for alarm consent
    const hasAlarmConsent = await PrivacyConsentService.hasActiveConsent({
      userId: ownerId,
      purpose: PrivacyPurpose.ALARM_CODE_DISCLOSURE,
    });

    const result = {
      lockboxCode: hasLockboxConsent ? (listing as any).lockboxCode : "[CONSENT REQUIRED]",
      alarmCode: hasAlarmConsent ? (listing as any).alarmCode : "[CONSENT REQUIRED]",
      requiresBrokerAttendance: !hasLockboxConsent || !hasAlarmConsent,
    };

    // Log access attempt
    await prisma.privacyAuditLog.create({
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

    // OACIQ Rule: Don't disclose before land register publication
    const isPublishedInLandRegister = (listing as any).landRegisterPublishedAt != null;
    
    if (isPublishedInLandRegister) return true;

    // Exception: Disclosure to authorized license holders with client consent
    const ownerId = (listing as any).ownerUserId;
    const hasConsent = await PrivacyConsentService.hasActiveConsent({
      userId: ownerId,
      purpose: PrivacyPurpose.SOLD_PRICE_DISCLOSURE_TO_LICENSE_HOLDERS,
    });

    const isLicenseHolder = ["BROKER", "ADMIN"].includes(args.targetUserRole);

    return isLicenseHolder && hasConsent;
  }
}
