/**
 * Run AI extraction for a property document, store in document_extractions,
 * run matching and fraud alerts. Does not auto-approve; admin must confirm.
 */

import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { analyzePdfBuffer } from "./client";
import { computeVerificationMatch, createFraudAlertsIfNeeded } from "./matching";

export async function runExtractionForDocument(documentId: string): Promise<{
  extractionId: string;
  cadastre_number: string | null;
  owner_name: string | null;
  property_address: string | null;
  municipality: string | null;
  lot_number: string | null;
  confidence_score: number | null;
  verificationScore?: number;
  overallStatus?: string;
}> {
  const document = await prisma.propertyDocument.findUnique({
    where: { id: documentId },
    include: { listing: true },
  });
  if (!document) throw new Error("Document not found");
  if (document.documentType !== "LAND_REGISTRY_EXTRACT") {
    throw new Error("Only land register extracts can be analyzed");
  }

  let buffer: Buffer;
  try {
    const absolutePath = path.join(process.cwd(), "public", document.fileUrl.replace(/^\//, ""));
    buffer = await readFile(absolutePath);
  } catch {
    throw new Error("Document file not found on disk");
  }

  const result = await analyzePdfBuffer(buffer, documentId);

  const extraction = await prisma.documentExtraction.upsert({
    where: { documentId },
    create: {
      documentId,
      cadastreNumber: result.cadastre_number,
      ownerName: result.owner_name,
      propertyAddress: result.property_address,
      municipality: result.municipality,
      lotNumber: result.lot_number,
      confidenceScore: result.confidence_score,
      rawTextSnippet: result.raw_text_snippet ?? null,
    },
    update: {
      cadastreNumber: result.cadastre_number,
      ownerName: result.owner_name,
      propertyAddress: result.property_address,
      municipality: result.municipality,
      lotNumber: result.lot_number,
      confidenceScore: result.confidence_score,
      rawTextSnippet: result.raw_text_snippet ?? null,
    },
  });

  const matchResult = await computeVerificationMatch(document.listingId, extraction.id);
  await createFraudAlertsIfNeeded(
    document.listingId,
    {
      cadastreNumber: extraction.cadastreNumber,
      ownerName: extraction.ownerName,
      propertyAddress: extraction.propertyAddress,
      confidenceScore: extraction.confidenceScore,
    },
    documentId
  );

  return {
    extractionId: extraction.id,
    cadastre_number: extraction.cadastreNumber,
    owner_name: extraction.ownerName,
    property_address: extraction.propertyAddress,
    municipality: extraction.municipality,
    lot_number: extraction.lotNumber,
    confidence_score: extraction.confidenceScore,
    verificationScore: matchResult.verificationScore,
    overallStatus: matchResult.overallStatus,
  };
}
