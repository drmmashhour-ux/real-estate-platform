/**
 * Validate transaction and context before generating closing package.
 */

import { prisma } from "@/lib/db";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateTransactionForClosing(transactionId: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    include: {
      propertyIdentity: true,
      buyer: true,
      seller: true,
      deposits: true,
    },
  });
  if (!tx) {
    return { valid: false, errors: ["Transaction not found"] };
  }
  if (!tx.propertyIdentityId) {
    errors.push("Transaction has no property identity");
  }
  if (!tx.propertyIdentity) {
    errors.push("Property identity record not found");
  }
  if (!tx.buyerId || !tx.sellerId) {
    errors.push("Buyer and seller are required");
  }
  if (tx.status === "cancelled") {
    errors.push("Cannot generate closing package for a cancelled transaction");
  }
  if (tx.frozenByAdmin) {
    errors.push("Transaction is frozen by admin");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
