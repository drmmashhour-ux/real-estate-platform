import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "./events";
import type { DocumentType } from "./constants";

export interface UploadDocumentInput {
  transactionId: string;
  documentType: DocumentType | string;
  fileUrl: string;
}

export async function uploadTransactionDocument(input: UploadDocumentInput): Promise<{ documentId: string }> {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: input.transactionId },
    select: { id: true },
  });
  if (!tx) throw new Error("Transaction not found");

  const doc = await prisma.transactionDocument.create({
    data: {
      transactionId: input.transactionId,
      documentType: input.documentType,
      fileUrl: input.fileUrl,
    },
  });
  return { documentId: doc.id };
}

export type SignerRole = "buyer" | "seller" | "broker";

export interface SignDocumentInput {
  documentId: string;
  signerId: string;
  signerRole: SignerRole;
}

export async function signDocument(input: SignDocumentInput): Promise<{ allSigned: boolean }> {
  const doc = await prisma.transactionDocument.findUnique({
    where: { id: input.documentId },
    include: { transaction: { select: { buyerId: true, sellerId: true, brokerId: true } } },
  });
  if (!doc) throw new Error("Document not found");

  const roleMatches: Record<SignerRole, boolean> = {
    buyer: doc.transaction.buyerId === input.signerId,
    seller: doc.transaction.sellerId === input.signerId,
    broker: doc.transaction.brokerId === input.signerId,
  };
  if (!roleMatches[input.signerRole]) throw new Error("Signer does not match role");

  const updates: { signedByBuyer?: boolean; signedBySeller?: boolean; signedByBroker?: boolean } = {};
  if (input.signerRole === "buyer") updates.signedByBuyer = true;
  if (input.signerRole === "seller") updates.signedBySeller = true;
  if (input.signerRole === "broker") updates.signedByBroker = true;

  await prisma.transactionDocument.update({
    where: { id: input.documentId },
    data: {
      ...updates,
      signedAt: new Date(),
    },
  });

  const updated = await prisma.transactionDocument.findUnique({
    where: { id: input.documentId },
    select: { signedByBuyer: true, signedBySeller: true, signedByBroker: true, transactionId: true },
  });
  if (!updated) return { allSigned: false };

  const needsBroker = !!doc.transaction.brokerId;
  const allSigned =
    updated.signedByBuyer &&
    updated.signedBySeller &&
    (!needsBroker || updated.signedByBroker);

  if (allSigned) {
    await prisma.realEstateTransaction.update({
      where: { id: updated.transactionId },
      data: { status: "contract_signed" },
    });
    await recordTransactionEvent(updated.transactionId, "contract_signed", { documentId: input.documentId }, input.signerId);
  }

  return { allSigned };
}
