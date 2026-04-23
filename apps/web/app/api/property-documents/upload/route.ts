import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { checkQuotaBeforeUpload, addUsage } from "@/lib/storage-quota";
import { createStorageFileRecord } from "@/lib/storage/record";
import { savePropertyDocument } from "@/lib/verification/document-storage";
import type { PropertyDocumentType } from "@prisma/client";

const ALLOWED_TYPES: PropertyDocumentType[] = ["LAND_REGISTRY_EXTRACT", "BROKER_AUTHORIZATION"];

/**
 * POST /api/property-documents/upload
 * Fields: listing_id, document_type, file (PDF).
 * document_type: land_registry_extract | broker_authorization
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const formData = await request.formData();
    const listingId = formData.get("listing_id") as string | null;
    const documentTypeRaw = formData.get("document_type") as string | null;
    const file = formData.get("file") as File | null;

    if (!listingId?.trim()) {
      return Response.json({ error: "listing_id required" }, { status: 400 });
    }
    const documentType =
      documentTypeRaw === "land_registry_extract"
        ? "LAND_REGISTRY_EXTRACT"
        : documentTypeRaw === "broker_authorization"
          ? "BROKER_AUTHORIZATION"
          : null;
    if (!documentType || !ALLOWED_TYPES.includes(documentType)) {
      return Response.json(
        { error: "document_type must be land_registry_extract or broker_authorization" },
        { status: 400 }
      );
    }
    if (!file || file.size === 0) {
      return Response.json({ error: "file (PDF) required" }, { status: 400 });
    }

    try {
      await checkQuotaBeforeUpload(userId, file.size);
    } catch {
      return Response.json({ error: "Storage limit reached. Upgrade plan." }, { status: 400 });
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, listingVerificationStatus: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Only the listing host can upload documents" }, { status: 403 });
    }
    const allowedStatuses = ["DRAFT", "PENDING_DOCUMENTS"];
    if (!listing.listingVerificationStatus || !allowedStatuses.includes(listing.listingVerificationStatus)) {
      return Response.json(
        { error: "Cannot add documents in current listing state" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/pdf";
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await savePropertyDocument({
      listingId,
      buffer,
      mimeType,
      originalFilename: file.name,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const cadastreNumber = (formData.get("cadastre_number") as string | null)?.trim() || null;
    const ownerName = (formData.get("owner_name") as string | null)?.trim() || null;

    const doc = await prisma.propertyDocument.create({
      data: {
        listingId,
        documentType,
        fileUrl: result.relativeUrl,
        cadastreNumber,
        ownerName,
        uploadedById: userId,
      },
    });

    await addUsage(userId, file.size).catch(() => {});

    await createStorageFileRecord({
      userId,
      listingId,
      entityType: "property_document",
      entityId: doc.id,
      fileUrl: doc.fileUrl,
      fileType: "document",
      mimeType: mimeType,
      originalSize: file.size,
      retentionPolicy: "legal",
      optimizationStatus: "skipped",
    }).catch(() => {});

    return Response.json({
      id: doc.id,
      listing_id: doc.listingId,
      document_type: documentTypeRaw,
      file_url: doc.fileUrl,
      cadastre_number: doc.cadastreNumber,
      owner_name: doc.ownerName,
      uploaded_at: doc.uploadedAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
