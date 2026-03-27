import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { deleteSellerDocumentFromStorage } from "@/lib/seller/seller-document-storage";
import { SellerSupportingDocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_SET = new Set(Object.values(SellerSupportingDocumentStatus));

async function loadDoc(fsboListingId: string, docId: string) {
  return prisma.sellerSupportingDocument.findFirst({
    where: { id: docId, fsboListingId },
    include: { fsboListing: { select: { ownerId: true, status: true } } },
  });
}

/** DELETE — owner (when listing editable) or admin. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string; docId: string }> }) {
  const { id: fsboListingId, docId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const doc = await loadDoc(fsboListingId, docId);
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const isAdmin = await isPlatformAdmin(userId);
  const isOwner = doc.fsboListing.ownerId === userId;
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (isOwner && !isAdmin) {
    if (doc.fsboListing.status === "SOLD" || doc.fsboListing.status === "PENDING_VERIFICATION") {
      return Response.json({ error: "Listing cannot be edited" }, { status: 409 });
    }
  }

  await deleteSellerDocumentFromStorage(doc.storagePath);
  await prisma.sellerSupportingDocument.delete({ where: { id: doc.id } });

  return Response.json({ ok: true });
}

/** PATCH — admin only: verification status. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string; docId: string }> }) {
  const { id: fsboListingId, docId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const isAdmin = await isPlatformAdmin(userId);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const doc = await loadDoc(fsboListingId, docId);
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const statusRaw = "status" in body ? String((body as { status?: unknown }).status ?? "").trim() : "";
  if (!STATUS_SET.has(statusRaw as SellerSupportingDocumentStatus)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.sellerSupportingDocument.update({
    where: { id: doc.id },
    data: { status: statusRaw as SellerSupportingDocumentStatus },
  });

  return Response.json({
    ok: true,
    document: {
      id: updated.id,
      status: updated.status,
    },
  });
}
