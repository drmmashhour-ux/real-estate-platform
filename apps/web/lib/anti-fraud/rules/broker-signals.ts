/**
 * Broker-related fraud signals: invalid license, no auth document, suspicious activity.
 */

import { prisma } from "@/lib/db";
import type { FraudReason } from "../models";

const LICENSE_REGEX = /^[\p{L}\p{N}\s\-./]{3,50}$/u;

export async function checkInvalidBrokerLicense(
  brokerLicenseNumber: string | null
): Promise<FraudReason | null> {
  if (!brokerLicenseNumber?.trim()) return null;
  const t = brokerLicenseNumber.trim();
  if (t.length < 3 || t.length > 50) return { signal: "invalid_broker_license", points: 25 };
  if (!LICENSE_REGEX.test(t)) return { signal: "invalid_broker_license", points: 25 };
  return null;
}

export async function checkBrokerNoAuthorizationDocument(
  listingId: string,
  listingAuthorityType: string | null
): Promise<FraudReason | null> {
  if (listingAuthorityType !== "BROKER") return null;
  const hasAuth = await prisma.propertyDocument.findFirst({
    where: { listingId, documentType: "BROKER_AUTHORIZATION" },
    select: { id: true },
  });
  if (hasAuth) return null;
  return { signal: "broker_no_authorization_document", points: 35 };
}

export async function checkBrokerSuspiciousListings(ownerId: string): Promise<FraudReason | null> {
  const rejected = await prisma.shortTermListing.count({
    where: { ownerId, listingVerificationStatus: "REJECTED" },
  });
  const total = await prisma.shortTermListing.count({
    where: { ownerId, listingAuthorityType: "BROKER" },
  });
  if (total < 2) return null;
  if (rejected / total >= 0.5) {
    return {
      signal: "broker_suspicious_listings",
      points: 20,
      detail: `${rejected}/${total} broker listings rejected`,
    };
  }
  return null;
}
