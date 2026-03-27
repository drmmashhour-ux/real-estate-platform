/**
 * Triple verification: Broker license verification when listing_authority_type = broker.
 * Validate broker license format, require owner authorization document, verify cadastre in auth doc.
 */

import { prisma } from "@/lib/db";
import type { VerificationStatus } from "@prisma/client";

// Basic format: alphanumeric, often with dashes (e.g. Québec OACIQ format)
const LICENSE_REGEX = /^[\p{L}\p{N}\s\-./]+$/u;

export function validateBrokerLicenseFormat(licenseNumber: string): { valid: boolean; error?: string } {
  const t = licenseNumber?.trim();
  if (!t || t.length < 3) {
    return { valid: false, error: "Broker license number is required" };
  }
  if (t.length > 50) {
    return { valid: false, error: "License number too long" };
  }
  if (!LICENSE_REGEX.test(t)) {
    return { valid: false, error: "Invalid license number format" };
  }
  return { valid: true };
}

export async function getBrokerVerification(userId: string) {
  return prisma.brokerVerification.findUnique({
    where: { userId },
  });
}

export async function upsertBrokerVerification(params: {
  userId: string;
  licenseNumber: string;
  brokerageCompany: string;
}) {
  const validation = validateBrokerLicenseFormat(params.licenseNumber);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  if (!params.brokerageCompany?.trim()) {
    throw new Error("Brokerage company is required");
  }
  return prisma.brokerVerification.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      licenseNumber: params.licenseNumber.trim(),
      brokerageCompany: params.brokerageCompany.trim(),
      verificationStatus: "PENDING",
    },
    update: {
      licenseNumber: params.licenseNumber.trim(),
      brokerageCompany: params.brokerageCompany.trim(),
    },
  });
}

export async function setBrokerVerificationDecision(
  userId: string,
  status: VerificationStatus,
  adminUserId: string,
  notes?: string | null
) {
  return prisma.brokerVerification.update({
    where: { userId },
    data: {
      verificationStatus: status,
      verifiedById: adminUserId,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      notes: notes ?? undefined,
    },
  });
}

export async function isBrokerVerified(userId: string): Promise<boolean> {
  const r = await prisma.brokerVerification.findUnique({
    where: { userId },
    select: { verificationStatus: true },
  });
  return r?.verificationStatus === "VERIFIED";
}
