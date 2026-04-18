import { fraudTrustV1Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type ImageIntegrityInsight = {
  fsboListingId: string;
  duplicateImageAcrossOtherListings: boolean;
  duplicateShaCount: number;
  explanation: string[];
};

/**
 * Cross-listing duplicate detection via `MediaContentFingerprint` (SHA-256).
 */
export async function analyzeFsboListingImageIntegrity(fsboListingId: string): Promise<ImageIntegrityInsight | null> {
  if (!fraudTrustV1Flags.imageVerificationV1) return null;

  const fps = await prisma.mediaContentFingerprint.findMany({
    where: { fsboListingId },
    select: { sha256: true },
  });
  if (fps.length === 0) {
    return {
      fsboListingId,
      duplicateImageAcrossOtherListings: false,
      duplicateShaCount: 0,
      explanation: ["No media fingerprints on file — run ingestion pipeline first."],
    };
  }

  const hashes = [...new Set(fps.map((f) => f.sha256))];
  const others = await prisma.mediaContentFingerprint.findMany({
    where: {
      sha256: { in: hashes },
      fsboListingId: { not: fsboListingId },
    },
    select: { id: true },
    take: 80,
  });

  const dup = others.length > 0;
  return {
    fsboListingId,
    duplicateImageAcrossOtherListings: dup,
    duplicateShaCount: others.length,
    explanation: dup
      ? [
          "One or more gallery hashes match another listing — possible reused/stock media; manual review recommended.",
        ]
      : ["No cross-listing hash collisions in index."],
  };
}
