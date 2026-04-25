/**
 * OACIQ-style professional gates (Quebec real estate brokerage context).
 * Enforces verified broker vs verified owner paths before listings and deals.
 */

import { prisma } from "@/lib/db";
import type { ListingAuthorityType } from "@prisma/client";
import { getOwnerVerificationStatus } from "@/lib/bnhub/mandatory-verification";
import { ComplianceLicenseService } from "./compliance-license.service";

export type ComplianceResult = { ok: boolean; reasons: string[] };

/** Platform broker license + admin verification (BrokerVerification record). */
export async function getBrokerProfessionalCompliance(userId: string): Promise<ComplianceResult> {
  const reasons: string[] = [];
  const [user, bv, license] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { brokerStatus: true, accountStatus: true },
    }),
    prisma.brokerVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
    ComplianceLicenseService.validateBrokerLicense(userId),
  ]);

  if (user?.accountStatus !== "ACTIVE") {
    reasons.push("Account must be active");
  }
  if (user?.brokerStatus !== "VERIFIED") {
    reasons.push("Broker license must be verified by the platform before broker-authorized listings or deals");
  }
  if (bv?.verificationStatus !== "VERIFIED") {
    reasons.push("Broker verification (license review) must be approved");
  }
  if (!license.valid) {
    reasons.push(license.reason || "Valid OACIQ license required for brokerage actions.");
  }

  return { ok: reasons.length === 0, reasons };
}

/** Owner path: ID + ownership confirmation (BNHUB mandatory pipeline). */
export async function getOwnerProfessionalCompliance(userId: string): Promise<ComplianceResult> {
  const o = await getOwnerVerificationStatus(userId);
  if (o.overall === "verified") return { ok: true, reasons: [] };
  return { ok: false, reasons: o.reasons.length ? o.reasons : ["Owner verification incomplete"] };
}

/**
 * Before creating a BNHUB-style listing: owner listings require verified owner; broker listings require verified broker + license metadata.
 */
export async function assertCanCreateListing(params: {
  userId: string;
  listingAuthorityType?: ListingAuthorityType | null;
  brokerLicenseNumber?: string | null;
  brokerageName?: string | null;
}): Promise<ComplianceResult> {
  const authority = params.listingAuthorityType ?? "OWNER";
  if (authority === "BROKER") {
    const b = await getBrokerProfessionalCompliance(params.userId);
    const reasons = [...b.reasons];
    if (!params.brokerLicenseNumber?.trim()) {
      reasons.push("Broker license number is required for broker-authorized listings");
    }
    if (!params.brokerageName?.trim()) {
      reasons.push("Brokerage name is required for broker-authorized listings");
    }
    return { ok: reasons.length === 0, reasons };
  }
  return getOwnerProfessionalCompliance(params.userId);
}

/** Before participating as broker on a deal (create / act as broker). */
export async function assertBrokerCanParticipateInDeals(userId: string): Promise<ComplianceResult> {
  return getBrokerProfessionalCompliance(userId);
}
