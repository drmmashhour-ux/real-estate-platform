import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runExtractionForDocument } from "@/lib/document-ai/run-extraction";

/**
 * POST /api/document-ai/analyze
 * Body: document_id (existing document to re-analyze) OR multipart with file + listing_id + document_type.
 * Runs extraction, stores in document_extractions, runs matching and fraud alerts. Does not auto-approve.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const documentId = (formData.get("document_id") as string)?.trim();
      if (documentId) {
        const doc = await prisma.propertyDocument.findUnique({
          where: { id: documentId },
          select: { uploadedById: true },
        });
        if (!doc || doc.uploadedById !== userId) {
          return Response.json({ error: "Document not found or access denied" }, { status: 404 });
        }
        const result = await runExtractionForDocument(documentId);
        return Response.json({
          document_id: documentId,
          extraction: {
            cadastre_number: result.cadastre_number,
            owner_name: result.owner_name,
            property_address: result.property_address,
            municipality: result.municipality,
            lot_number: result.lot_number,
            confidence_score: result.confidence_score,
          },
          verification_score: result.verificationScore,
          overall_status: result.overallStatus,
        });
      }
      const file = formData.get("file") as File | null;
      const listingId = (formData.get("listing_id") as string)?.trim();
      if (!file?.size || !listingId) {
        return Response.json(
          { error: "When not providing document_id, file and listing_id required" },
          { status: 400 }
        );
      }
      const listing = await prisma.shortTermListing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
      });
      if (!listing || listing.ownerId !== userId) {
        return Response.json({ error: "Listing not found or access denied" }, { status: 404 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { savePropertyDocument } = await import("@/lib/verification/document-storage");
      const saveResult = await savePropertyDocument({
        listingId,
        buffer,
        mimeType: file.type || "application/pdf",
        originalFilename: file.name,
      });
      if (!saveResult.ok) {
        return Response.json({ error: saveResult.error }, { status: 400 });
      }
      const doc = await prisma.propertyDocument.create({
        data: {
          listingId,
          documentType: "LAND_REGISTRY_EXTRACT",
          fileUrl: saveResult.relativeUrl,
          uploadedById: userId,
        },
      });
      const result = await runExtractionForDocument(doc.id);
      return Response.json({
        document_id: doc.id,
        extraction: {
          cadastre_number: result.cadastre_number,
          owner_name: result.owner_name,
          property_address: result.property_address,
          municipality: result.municipality,
          lot_number: result.lot_number,
          confidence_score: result.confidence_score,
        },
        verification_score: result.verificationScore,
        overall_status: result.overallStatus,
      });
    }

    const body = await request.json().catch(() => ({}));
    const documentId = (body.document_id as string)?.trim();
    if (!documentId) {
      return Response.json({ error: "document_id required" }, { status: 400 });
    }
    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      select: { uploadedById: true },
    });
    if (!doc || doc.uploadedById !== userId) {
      return Response.json({ error: "Document not found or access denied" }, { status: 404 });
    }
    const result = await runExtractionForDocument(documentId);
    return Response.json({
      document_id: documentId,
      extraction: {
        cadastre_number: result.cadastre_number,
        owner_name: result.owner_name,
        property_address: result.property_address,
        municipality: result.municipality,
        lot_number: result.lot_number,
        confidence_score: result.confidence_score,
      },
      verification_score: result.verificationScore,
      overall_status: result.overallStatus,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
