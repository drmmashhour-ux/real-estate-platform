import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { FSBO_DOC_MAX_BYTES, uploadFsboListingDoc } from "@/lib/fsbo/upload-fsbo-listing-doc";

export const dynamic = "force-dynamic";

/**
 * Upload mandate / corporate / professional supporting docs for enhanced authority path.
 * URLs are stored in `sellerDeclarationJson.authoritySupplementalDocs`.
 */
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

  const docId = String(form.get("docId") ?? "").trim();
  if (!docId || docId.length > 120) {
    return Response.json({ error: "docId required" }, { status: 400 });
  }

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
      folder: `authority-supplemental/${docId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    });
    return Response.json({
      ok: true,
      url,
      fileName,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
