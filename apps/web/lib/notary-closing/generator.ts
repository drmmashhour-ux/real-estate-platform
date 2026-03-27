/**
 * Closing package generator – assembles notary-ready documents and creates package.
 */

import { prisma } from "@/lib/db";
import { renderTemplate } from "@/lib/document-drafting/template-engine";
import type { DocumentGenerationContext } from "@/lib/document-drafting/types";
import { getTransactionClosingContext } from "./transaction-data";
import { validateTransactionForClosing } from "./validators";
import { CLOSING_TEMPLATES } from "./templates";
import type { ClosingDocumentType } from "./types";

const CLOSING_DOC_TYPES: ClosingDocumentType[] = [
  "offer",
  "property_sheet",
  "buyer_info",
  "seller_info",
  "broker_details",
  "transaction_summary",
  "payment_summary",
  "ownership_verification",
  "broker_authorization",
];

function signatureFieldsForTransaction(tx: { buyer: { name: string | null; email: string }; seller: { name: string | null; email: string }; broker?: { name: string | null; email: string } | null }) {
  const fields: Array<{ signerRole: string; signerName: string; signerEmail: string; label?: string }> = [
    { signerRole: "buyer", signerName: tx.buyer.name ?? "Buyer", signerEmail: tx.buyer.email, label: "buyer_signature" },
    { signerRole: "seller", signerName: tx.seller.name ?? "Seller", signerEmail: tx.seller.email, label: "seller_signature" },
  ];
  if (tx.broker) {
    fields.push({ signerRole: "broker", signerName: tx.broker.name ?? "Broker", signerEmail: tx.broker.email, label: "broker_signature" });
  }
  fields.push({ signerRole: "admin", signerName: "Notary", signerEmail: "", label: "notary_signature" });
  return fields;
}

export async function generateClosingPackage(transactionId: string, generatedByUserId: string) {
  const validation = await validateTransactionForClosing(transactionId);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
  }

  const data = await getTransactionClosingContext(transactionId);
  if (!data) throw new Error("Transaction not found");
  const { context, transaction: tx } = data;

  const existingPackage = await prisma.closingPackage.findFirst({
    where: { transactionId },
    orderBy: { createdAt: "desc" },
  });
  const versionNumber = existingPackage ? await prisma.closingPackageDocument.count({ where: { packageId: existingPackage.id } }) + 1 : 1;

  const pkg = await prisma.closingPackage.create({
    data: {
      transactionId,
      packageStatus: "draft",
      generatedById: generatedByUserId,
    },
  });

  const signatureFields = signatureFieldsForTransaction(tx);
  const docIds: { documentType: ClosingDocumentType; documentId: string }[] = [];

  for (const docType of CLOSING_DOC_TYPES) {
    const template = CLOSING_TEMPLATES[docType];
    if (!template) continue;
    const contentHtml = renderTemplate(template, context as DocumentGenerationContext);
    const genDoc = await prisma.generatedDocument.create({
      data: {
        documentType: docType,
        relatedEntityType: "transaction",
        relatedEntityId: transactionId,
        generatedById: generatedByUserId,
        format: "html",
        status: "draft",
        versionNumber: 1,
        contentHtml,
        signatureFields: signatureFields as unknown as object,
      },
    });
    await prisma.closingPackageDocument.create({
      data: {
        packageId: pkg.id,
        documentId: genDoc.id,
        documentType: docType,
      },
    });
    docIds.push({ documentType: docType, documentId: genDoc.id });
  }

  return prisma.closingPackage.findUnique({
    where: { id: pkg.id },
    include: {
      documents: { include: { document: { select: { id: true, documentType: true, contentHtml: true, signatureFields: true } } } },
      transaction: { select: { id: true, status: true } },
      generatedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getPackageByTransactionId(transactionId: string) {
  return prisma.closingPackage.findFirst({
    where: { transactionId },
    orderBy: { createdAt: "desc" },
    include: {
      documents: { include: { document: true } },
      transaction: true,
      generatedBy: { select: { id: true, name: true, email: true } },
      notary: true,
    },
  });
}

export async function getPackageDocuments(packageId: string) {
  return prisma.closingPackageDocument.findMany({
    where: { packageId },
    include: { document: true },
    orderBy: { createdAt: "asc" },
  });
}
