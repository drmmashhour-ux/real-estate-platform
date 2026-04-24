import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

export type ConsentType = "OACIQ_DISCLOSURE" | "AMF_TRANSPARENCY" | "DATA_PRIVACY" | "AI_USAGE";

/**
 * Compliance Service: Manages regulatory consents, data privacy, and audit logs.
 */
export async function recordConsent(userId: string, type: ConsentType, granted: boolean) {
  const result = await prisma.lecipmRegulatoryConsent.upsert({
    where: {
      userId_consentType: {
        userId,
        // @ts-ignore
        consentType: type,
      },
    },
    update: {
      granted,
      grantedAt: granted ? new Date() : undefined,
      revokedAt: granted ? null : new Date(),
    },
    create: {
      userId,
      // @ts-ignore
      consentType: type,
      granted,
      grantedAt: granted ? new Date() : new Date(),
      revokedAt: granted ? null : new Date(),
    },
  });

  await logComplianceAction(userId, "CONSENT_UPDATED", { type, granted });
  return result;
}

/**
 * Log compliance-related actions for OACIQ/AMF audit trails.
 */
export async function logComplianceAction(userId: string | null, action: string, metadata: any = {}) {
  // @ts-ignore
  await prisma.lecipmRegulatoryAuditLog.create({
    data: {
      userId,
      entityType: "SYSTEM",
      entityId: "compliance",
      action,
      metadataJson: metadata,
    },
  });

  logInfo(`[compliance] ${action}`, { userId, ...metadata });
}

/**
 * Data Export: Aggregates all user data for transparency (GDPR/Law 25).
 */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Basic info
      profile: true,
      // Transactions
      dealsAsBuyer: true,
      dealsAsSeller: true,
      // Activity
      lecipmRegulatoryConsents: true,
    },
  });

  await logComplianceAction(userId, "DATA_EXPORT_REQUESTED");
  return user;
}

/**
 * Broker Compliance: Ensure broker identity and clear role representation.
 */
export async function verifyBrokerCompliance(brokerId: string) {
  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    include: {
      brokerVerifications: true,
    },
  });

  const isVerified = broker?.brokerVerifications.some(v => v.verificationStatus === "VERIFIED");
  
  if (!isVerified) {
    await logComplianceAction(brokerId, "BROKER_COMPLIANCE_FAIL", { reason: "NOT_VERIFIED" });
    return { ok: false, error: "Broker identity not verified" };
  }

  return { ok: true, license: broker?.brokerVerifications[0].licenseNumber };
}
