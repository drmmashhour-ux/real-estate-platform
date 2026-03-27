/**
 * Document-related fraud signals: low confidence, missing ownership doc.
 */

import { prisma } from "@/lib/db";
import type { FraudReason } from "../models";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export async function checkLowDocumentConfidence(listingId: string): Promise<FraudReason | null> {
  const ext = await prisma.documentExtraction.findFirst({
    where: { document: { listingId, documentType: "LAND_REGISTRY_EXTRACT" } },
    select: { confidenceScore: true },
  });
  if (ext?.confidenceScore == null) return null;
  if (ext.confidenceScore >= LOW_CONFIDENCE_THRESHOLD) return null;
  return {
    signal: "low_document_confidence",
    points: 15,
    detail: `Confidence ${(ext.confidenceScore * 100).toFixed(0)}%`,
  };
}

export async function checkMissingOwnershipDocument(
  listingId: string,
  listingVerificationStatus: string | null
): Promise<FraudReason | null> {
  if (listingVerificationStatus === "DRAFT") return null;
  const hasExtract = await prisma.propertyDocument.findFirst({
    where: { listingId, documentType: "LAND_REGISTRY_EXTRACT" },
    select: { id: true },
  });
  if (hasExtract) return null;
  return { signal: "missing_ownership_document", points: 25 };
}
