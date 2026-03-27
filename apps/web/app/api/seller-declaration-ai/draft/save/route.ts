import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { saveDeclarationDraft } from "@/src/modules/seller-declaration-ai/application/saveDeclarationDraft";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const draftId = body.draftId ? String(body.draftId) : undefined;
  const payload = (body.payload ?? {}) as Record<string, unknown>;

  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });
  const auth = await requireSellerOrAdminForListing(listingId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId }, select: { ownerId: true } });
  const saved = await saveDeclarationDraft({
    draftId,
    listingId,
    sellerUserId: listing?.ownerId ?? null,
    adminUserId: auth.isAdmin ? auth.userId : null,
    payload,
  });

  return NextResponse.json({
    draft: {
      id: saved.row.id,
      listingId: saved.row.listingId,
      status: saved.row.status,
      draftPayload: saved.row.draftPayload,
      updatedAt: saved.row.updatedAt,
    },
    validation: saved.validation,
  });
}
