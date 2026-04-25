import { prisma } from "@/lib/db";
import { createHash } from "crypto";

/**
 * Calculates SHA-256 hash of a buffer (PDF content).
 */
export function calculatePdfHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Records a hash for a document to ensure immutability.
 */
export async function recordDocumentHash(entityId: string, entityType: "DRAFT_PDF" | "DEAL_PDF", hash: string, metadata?: any) {
  try {
    await (prisma as any).documentHash.create({
      data: {
        entityId,
        entityType,
        hash,
        metadata: metadata ? metadata : undefined,
      }
    });
  } catch (error) {
    console.error("[pdf-protection] Failed to record document hash:", error);
  }
}

/**
 * Verifies if a document hash matches the recorded one.
 */
export async function verifyDocumentHash(entityId: string, entityType: "DRAFT_PDF" | "DEAL_PDF", currentHash: string): Promise<boolean> {
  const recorded = await (prisma as any).documentHash.findFirst({
    where: { entityId, entityType },
    orderBy: { createdAt: "desc" },
  });

  return recorded?.hash === currentHash;
}
