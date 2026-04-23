import { prisma } from "@/lib/db";

export interface BrokerDocumentContext {
  brokerName: string;
  licenseNumber: string;
  fullAddress: string;
  practiceMode: string;
}

/**
 * PHASE 2: DOCUMENT CONTEXT ENGINE
 * Builds an immutable context for a broker to be used in contracts and documents.
 */
export async function buildBrokerDocumentContext(userId: string): Promise<BrokerDocumentContext> {
  const profile = await prisma.lecipmBrokerLicenceProfile.findUnique({
    where: { userId },
  });

  if (!profile || !profile.licenceNumber) {
    throw new Error("Broker profile or licence number missing for identity injection.");
  }

  const fullAddress = [
    profile.addressLine,
    profile.city,
    profile.province ? `(${profile.province})` : "",
    profile.postalCode,
  ].filter(Boolean).join(", ");

  return {
    brokerName: profile.fullName || "Unknown Broker",
    licenseNumber: profile.licenceNumber,
    fullAddress,
    practiceMode: profile.practiceMode || "INDEPENDENT",
  };
}

/**
 * PHASE 5: SIGNATURE BLOCK
 * Formats a standard signature block for OACIQ compliance.
 */
export function formatBrokerSignatureBlock(ctx: BrokerDocumentContext): string {
  return `Real estate broker: ${ctx.brokerName}, OACIQ licence ${ctx.licenseNumber}, ${ctx.fullAddress}`;
}

/**
 * PHASE 6: IMMUTABILITY
 * Takes a snapshot of current broker info for a transaction.
 */
export async function snapshotBrokerInfo(userId: string): Promise<Record<string, any>> {
  const ctx = await buildBrokerDocumentContext(userId);
  return {
    ...ctx,
    snapshottedAt: new Date().toISOString(),
  };
}
