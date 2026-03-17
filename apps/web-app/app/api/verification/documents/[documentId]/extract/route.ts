import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { extractFromLandRegisterPdf, compareExtractWithListing } from "@/lib/verification/ai-extract";

/**
 * POST /api/verification/documents/[documentId]/extract
 * Optional AI: extract cadastre, owner name, address from land register PDF and compare with listing.
 * Returns extracted data and comparison result; when no AI is configured, extracted fields are null.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const { documentId } = await context.params;

    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      include: {
        listing: {
          select: {
            id: true,
            ownerId: true,
            cadastreNumber: true,
            address: true,
            owner: { select: { name: true } },
          },
        },
      },
    });
    if (!doc || doc.documentType !== "LAND_REGISTRY_EXTRACT") {
      return Response.json({ error: "Document not found or not a land register extract" }, { status: 404 });
    }
    if (doc.listing.ownerId !== userId) {
      return Response.json({ error: "Not authorized to access this document" }, { status: 403 });
    }

    const extracted = await extractFromLandRegisterPdf({ fileUrl: doc.fileUrl });
    const comparison = compareExtractWithListing(
      extracted,
      { cadastreNumber: doc.listing.cadastreNumber, address: doc.listing.address },
      doc.listing.owner.name
    );

    return Response.json({
      extracted: comparison.extracted,
      comparison: {
        cadastreMatch: comparison.cadastreMatch,
        ownerNameMatch: comparison.ownerNameMatch,
        addressMatch: comparison.addressMatch,
        allMatch: comparison.allMatch,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Extract failed" },
      { status: 500 }
    );
  }
}
