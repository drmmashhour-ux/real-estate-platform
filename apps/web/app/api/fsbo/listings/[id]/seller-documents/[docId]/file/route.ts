import { readFile } from "fs/promises";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  createSellerDocumentSignedUrl,
  localSellerDocumentAbsolutePath,
} from "@/lib/seller/seller-document-storage";

export const dynamic = "force-dynamic";

/**
 * GET — redirect to signed URL (Supabase) or stream local file.
 * Query: `download=1` sets Content-Disposition attachment.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string; docId: string }> }) {
  const { id: fsboListingId, docId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const doc = await prisma.sellerSupportingDocument.findFirst({
    where: { id: docId, fsboListingId },
    include: { fsboListing: { select: { ownerId: true } } },
  });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const isAdmin = await isPlatformAdmin(userId);
  if (doc.fsboListing.ownerId !== userId && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const asDownload = url.searchParams.get("download") === "1" || url.searchParams.get("download") === "true";

  if (!doc.storagePath.startsWith("local:")) {
    const signed = await createSellerDocumentSignedUrl(doc.storagePath, 300, {
      download: asDownload ? doc.originalFileName : undefined,
    });
    if (signed) {
      return Response.redirect(signed, 302);
    }
    return Response.json({ error: "Could not generate access URL" }, { status: 503 });
  }

  const abs = localSellerDocumentAbsolutePath(doc.storagePath);
  if (!abs) return Response.json({ error: "Invalid storage path" }, { status: 500 });

  let buf: Buffer;
  try {
    buf = await readFile(abs);
  } catch {
    return Response.json({ error: "File missing" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", doc.mimeType || "application/octet-stream");
  if (asDownload) {
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.originalFileName)}"`);
  } else {
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalFileName)}"`);
  }

  return new Response(new Uint8Array(buf), { status: 200, headers });
}
