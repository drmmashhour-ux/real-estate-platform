/**
 * Fraud protection: verify buyer identity, seller ownership, property identity before accepting offers.
 */

import { prisma } from "@/lib/db";

export interface TransactionVerificationResult {
  ok: boolean;
  errors: string[];
}

export async function verifyTransactionParties(transactionId: string): Promise<TransactionVerificationResult> {
  const errors: string[] = [];
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    include: {
      propertyIdentity: { select: { id: true, verificationScore: true, riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 } } },
      buyer: { select: { id: true } },
      seller: { select: { id: true } },
    },
  });
  if (!tx) {
    return { ok: false, errors: ["Transaction not found"] };
  }

  const [buyerIdentity, sellerListing] = await Promise.all([
    prisma.identityVerification.findUnique({
      where: { userId: tx.buyerId },
      select: { verificationStatus: true },
    }),
    prisma.shortTermListing.findFirst({
      where: { propertyIdentityId: tx.propertyIdentityId, ownerId: tx.sellerId },
      select: { id: true },
    }),
  ]);

  if (buyerIdentity?.verificationStatus !== "VERIFIED") {
    errors.push("Buyer identity is not verified");
  }
  if (!sellerListing && !(await prisma.propertyIdentityOwner.findFirst({ where: { propertyIdentityId: tx.propertyIdentityId }, select: { id: true } }))) {
    errors.push("Seller ownership or listing link could not be confirmed");
  }
  if ((tx.propertyIdentity.verificationScore ?? 0) < 50) {
    errors.push("Property identity verification score is insufficient");
  }
  const risk = tx.propertyIdentity.riskRecords[0];
  if (risk?.riskLevel === "high") {
    errors.push("Property has high fraud risk");
  }
  if (tx.frozenByAdmin) {
    errors.push("Transaction is frozen by admin");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
