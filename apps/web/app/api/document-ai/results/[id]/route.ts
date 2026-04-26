import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * GET /api/document-ai/results/:id (id = documentId)
 * Returns extracted fields, confidence score, verification match and score for the document.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: documentId } = await context.params;
    const document = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      include: {
        listing: {
          select: {
            id: true,
            ownerId: true,
            title: true,
            address: true,
            city: true,
            province: true,
            cadastreNumber: true,
            owner: { select: { name: true } },
          },
        },
        documentExtractions: true,
      },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }
    if (document.uploadedById !== userId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const extraction = document.documentExtractions?.[0];
    let verificationMatch: { cadastre_match: string; address_match: string; owner_match: string; overall_status: string; verification_score: number; checked_at: Date } | null = null;
    if (extraction) {
      const match = await prisma.verificationMatch.findUnique({
        where: { documentExtractionId: extraction.id },
      });
      if (match) {
        verificationMatch = {
          cadastre_match: match.cadastreMatch.toLowerCase(),
          address_match: match.addressMatch.toLowerCase(),
          owner_match: match.ownerMatch.toLowerCase(),
          overall_status: match.overallStatus.toLowerCase(),
          verification_score: match.verificationScore,
          checked_at: match.checkedAt,
        };
      }
    }

    return Response.json({
      document_id: document.id,
      listing_id: document.listingId,
      listing: document.listing
        ? {
            title: document.listing.title,
            address: document.listing.address,
            city: document.listing.city,
            province: document.listing.province,
            cadastre_number: document.listing.cadastreNumber,
            owner_name: document.listing.owner?.name,
          }
        : null,
      extraction: extraction
        ? {
            cadastre_number: extraction.cadastreNumber,
            owner_name: extraction.ownerName,
            property_address: extraction.propertyAddress,
            municipality: extraction.municipality,
            lot_number: extraction.lotNumber,
            confidence_score: extraction.confidenceScore,
            extracted_at: extraction.extractedAt,
          }
        : null,
      verification_match: verificationMatch,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get results" },
      { status: 500 }
    );
  }
}
