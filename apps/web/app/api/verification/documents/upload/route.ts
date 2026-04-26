import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { requireApiSession } from "@/lib/auth/require-api-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { savePropertyDocument } from "@/lib/verification/document-storage";
import type { PropertyDocumentType } from "@prisma/client";
import { safeApiError, toSafeErrorMessage } from "@/lib/security/api-error";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";

const ALLOWED_TYPES: PropertyDocumentType[] = ["LAND_REGISTRY_EXTRACT", "BROKER_AUTHORIZATION"];

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession();
    if (!session.ok) {
      return session.response;
    }
    const { userId } = session;

    const formData = await request.formData();
    const listingId = formData.get("listingId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const file = formData.get("file") as File | null;
    const cadastreNumber = (formData.get("cadastreNumber") as string | null)?.trim() || null;
    const ownerName = (formData.get("ownerName") as string | null)?.trim() || null;

    if (!listingId?.trim()) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }
    if (!documentType || !ALLOWED_TYPES.includes(documentType as PropertyDocumentType)) {
      return Response.json(
        { error: "documentType must be LAND_REGISTRY_EXTRACT or BROKER_AUTHORIZATION" },
        { status: 400 }
      );
    }
    if (!file || file.size === 0) {
      return Response.json({ error: "PDF file required" }, { status: 400 });
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, listingVerificationStatus: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Only the listing owner can upload documents" }, { status: 403 });
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

    const doc = await prisma.propertyDocument.create({
      data: {
        listingId,
        documentType: documentType as PropertyDocumentType,
        fileUrl: result.relativeUrl,
        cadastreNumber,
        ownerName,
        uploadedById: userId,
      },
    });
    return Response.json({
      id: doc.id,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      cadastreNumber: doc.cadastreNumber,
      ownerName: doc.ownerName,
      uploadedAt: doc.uploadedAt,
    });
  } catch (e) {
    const h = await headers();
    const requestId = h.get(REQUEST_ID_HEADER);
    return safeApiError(500, toSafeErrorMessage(e, "Upload failed"), {
      cause: e,
      requestId,
    });
  }
}
