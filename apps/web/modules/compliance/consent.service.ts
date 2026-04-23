import { prisma } from "@/lib/db";
import { Consent } from "@prisma/client";

export class PrivacyConsentService {
  /**
   * Checks if a user has active consent for a specific purpose.
   */
  static async hasActiveConsent(args: {
    userId: string;
    purpose: string;
    transactionId?: string;
  }): Promise<boolean> {
    const record = await prisma.consent.findFirst({
      where: {
        userId: args.userId,
        purpose: args.purpose,
        transactionId: args.transactionId ?? null,
        granted: true,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!record;
  }

  /**
   * Enforces consent for a specific purpose. Throws if not granted.
   */
  static async requireConsent(args: {
    userId: string;
    purpose: string;
    transactionId?: string;
  }): Promise<Consent> {
    const record = await prisma.consent.findFirst({
      where: {
        userId: args.userId,
        purpose: args.purpose,
        transactionId: args.transactionId ?? null,
        granted: true,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!record) {
      throw new Error(`Consent missing for purpose: ${args.purpose}`);
    }

    return record;
  }

  /**
   * Grants consent for a specific purpose.
   */
  static async grantConsent(args: {
    userId: string;
    purpose: string;
    transactionId?: string;
    scopeText?: string;
    explicit?: boolean;
    written?: boolean;
    expiresAt?: Date;
    legalBasisText?: string;
    evidenceRef?: string;
    createdBy?: string;
  }) {
    // Revoke any existing active consent for the same scope
    await prisma.consent.updateMany({
      where: {
        userId: args.userId,
        purpose: args.purpose,
        transactionId: args.transactionId ?? null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const record = await prisma.consent.create({
      data: {
        userId: args.userId,
        transactionId: args.transactionId ?? null,
        purpose: args.purpose,
        scopeText: args.scopeText || args.purpose,
        granted: true,
        explicit: args.explicit ?? true,
        written: args.written ?? true,
        expiresAt: args.expiresAt,
        legalBasisText: args.legalBasisText || "Law 25 (Québec) and OACIQ standards compliance.",
        evidenceRef: args.evidenceRef,
        createdBy: args.createdBy,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: "CONSENT_GRANTED",
        entityType: "Consent",
        entityId: record.id,
        purpose: args.purpose,
        metadata: {
          transactionId: args.transactionId,
          scopeText: args.scopeText,
        },
      },
    });

    return record;
  }

  /**
   * Revokes consent.
   */
  static async revokeConsent(args: {
    userId: string;
    purpose: string;
    transactionId?: string;
  }) {
    const now = new Date();
    const result = await prisma.consent.updateMany({
      where: {
        userId: args.userId,
        purpose: args.purpose,
        transactionId: args.transactionId ?? null,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: "CONSENT_REVOKED",
        purpose: args.purpose,
        metadata: {
          transactionId: args.transactionId,
          revokedCount: result.count,
        },
      },
    });

    return result;
  }
}
