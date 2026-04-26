import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { FSBO_DOC_MAX_BYTES, uploadFsboListingDoc } from "@/lib/fsbo/upload-fsbo-listing-doc";
import { FSBO_HUB_DOC_TYPES, type FsboHubDocType } from "@/lib/fsbo/seller-hub-doc-types";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";

export const dynamic = "force-dynamic";

const ALLOWED: Set<string> = new Set(Object.values(FSBO_HUB_DOC_TYPES));

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD" || listing.status === "PENDING_VERIFICATION") {
    return Response.json({ error: "Listing cannot be edited" }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const docTypeRaw = String(form.get("docType") ?? "").trim();
  if (!ALLOWED.has(docTypeRaw)) {
    return Response.json({ error: "Invalid docType" }, { status: 400 });
  }
  const docType = docTypeRaw as FsboHubDocType;

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file field required" }, { status: 400 });
  }
  if (file.size > FSBO_DOC_MAX_BYTES) {
    return Response.json({ error: `File too large (max ${Math.round(FSBO_DOC_MAX_BYTES / (1024 * 1024))}MB)` }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  try {
    const { url, fileName } = await uploadFsboListingDoc({
      listingId: id,
      buffer,
      contentType,
      originalName: file.name,
    });
    await ensureFsboListingDocumentSlots(id);
    await prisma.fsboListingDocument.updateMany({
      where: { fsboListingId: id, docType },
      data: {
        fileUrl: url,
        fileName,
        status: "uploaded",
      },
    });
    const insights = await persistSellerDeclarationAiReview(id);
    return Response.json({
      ok: true,
      url,
      fileName,
      docType,
      ...(insights
        ? { sellerDeclarationAiReview: insights.review, listingAiScores: insights.scores }
        : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
