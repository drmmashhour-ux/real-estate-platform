import { prisma } from "@/lib/db";
import { FSBO_HUB_ALL_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";

/**
 * Ensure one row per document slot for a listing (idempotent).
 */
export async function ensureFsboListingDocumentSlots(fsboListingId: string): Promise<void> {
  for (const docType of FSBO_HUB_ALL_DOC_TYPES) {
    await prisma.fsboListingDocument.upsert({
      where: {
        fsboListingId_docType: { fsboListingId, docType },
      },
      create: {
        fsboListingId,
        docType,
        status: "missing",
      },
      update: {},
    });
  }
}
