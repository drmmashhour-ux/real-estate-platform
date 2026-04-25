import { prisma } from "@/lib/db";
import { LecipmRegulatoryConsentType } from "@prisma/client";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 2: CONSENT SYSTEM
 * Manages user consent for data usage, AI decisioning, marketing, and financial simulation.
 */
export class ComplianceConsentService {
  /**
   * Checks if a user has granted a specific consent type.
   */
  static async hasConsent(userId: string, consentType: LecipmRegulatoryConsentType): Promise<boolean> {
    const consent = await prisma.lecipmRegulatoryConsent.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
    });

    return !!consent?.granted;
  }

  /**
   * Requires a specific consent type. Throws an error if not granted.
   */
  static async requireUserConsent(userId: string, consentType: LecipmRegulatoryConsentType) {
    const granted = await this.hasConsent(userId, consentType);
    if (!granted) {
      throw new Error(`CONSENT_REQUIRED: User has not granted consent for ${consentType}.`);
    }
  }

  /**
   * Grants consent for a user.
   */
  static async grantConsent(userId: string, consentType: LecipmRegulatoryConsentType) {
    const consent = await prisma.lecipmRegulatoryConsent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        revokedAt: null,
      },
      create: {
        userId,
        consentType,
        granted: true,
      },
    });

    await logActivity({
      userId,
      action: "consent_granted",
      entityType: "RegulatoryConsent",
      entityId: consent.id,
      metadata: { consentType },
    });

    return consent;
  }

  /**
   * Revokes consent for a user.
   */
  static async revokeConsent(userId: string, consentType: LecipmRegulatoryConsentType) {
    const consent = await prisma.lecipmRegulatoryConsent.update({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });

    await logActivity({
      userId,
      action: "consent_revoked",
      entityType: "RegulatoryConsent",
      entityId: consent.id,
      metadata: { consentType },
    });

    return consent;
  }
}
