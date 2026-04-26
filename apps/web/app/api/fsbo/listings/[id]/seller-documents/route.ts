import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  SELLER_DOC_MAX_BYTES,
  uploadSellerDocumentToStorage,
  SELLER_DOC_ALLOWED_MIME,
} from "@/lib/seller/seller-document-storage";
import { SellerSupportingDocumentCategory } from "@prisma/client";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { syncDocumentExtractionAfterSellerUpload } from "@/lib/trustgraph/application/integrations/sellerDeclarationDocumentIntegration";

export const dynamic = "force-dynamic";

const CATEGORY_SET = new Set(Object.values(SellerSupportingDocumentCategory));

function parseDeclarationSectionKey(raw: string | null): string | null {
  if (!raw || !String(raw).trim()) return null;
  const s = String(raw).trim();
  if (s.length > 64) return null;
  return s;
}

/** GET — list supporting documents (owner or admin). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: fsboListingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { ownerId: true },
  });
  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

  const isAdmin = await isPlatformAdmin(userId);
  if (listing.ownerId !== userId && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const docs = await prisma.sellerSupportingDocument.findMany({
    where: { fsboListingId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    documents: docs.map((d) => ({
      id: d.id,
      originalFileName: d.originalFileName,
      mimeType: d.mimeType,
      category: d.category,
      status: d.status,
      declarationSectionKey: d.declarationSectionKey,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

/** POST — upload one file (owner only; listing must be editable). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: fsboListingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
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

  const categoryRaw = String(form.get("category") ?? "").trim();
  if (!CATEGORY_SET.has(categoryRaw as SellerSupportingDocumentCategory)) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }
  const category = categoryRaw as SellerSupportingDocumentCategory;

  const declarationSectionKey = parseDeclarationSectionKey(
    form.get("declarationSectionKey") ? String(form.get("declarationSectionKey")) : null
  );

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file field required" }, { status: 400 });
  }
  if (file.size > SELLER_DOC_MAX_BYTES) {
    return Response.json(
      { error: `File too large (max ${Math.round(SELLER_DOC_MAX_BYTES / (1024 * 1024))}MB)` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  if (!SELLER_DOC_ALLOWED_MIME.has(contentType)) {
    return Response.json(
      { error: "Unsupported file type. Use PDF, JPG, PNG, GIF, WebP, DOC, DOCX, or CSV." },
      { status: 400 }
    );
  }

  try {
    const { storagePath } = await uploadSellerDocumentToStorage({
      userId,
      fsboListingId,
      buffer,
      contentType,
    });

    const row = await prisma.sellerSupportingDocument.create({
      data: {
        userId,
        fsboListingId,
        storagePath,
        originalFileName: file.name.slice(0, 512) || "document",
        mimeType: contentType,
        category,
        declarationSectionKey,
      },
    });

    const insights = await persistSellerDeclarationAiReview(fsboListingId);

    void syncDocumentExtractionAfterSellerUpload({
      fsboListingId,
      sellerDocumentId: row.id,
      storageRef: row.storagePath,
      category: row.category,
      fileName: row.originalFileName,
    }).catch(() => {});

    return Response.json({
      ok: true,
      document: {
        id: row.id,
        originalFileName: row.originalFileName,
        mimeType: row.mimeType,
        category: row.category,
        status: row.status,
        declarationSectionKey: row.declarationSectionKey,
        createdAt: row.createdAt.toISOString(),
      },
      ...(insights
        ? { sellerDeclarationAiReview: insights.review, listingAiScores: insights.scores }
        : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
