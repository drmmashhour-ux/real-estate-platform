import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { saveDeclarationDraft } from "@/src/modules/seller-declaration-ai/application/saveDeclarationDraft";
import { COMPLAINT_PLATFORM_OWNER_ID } from "@/lib/compliance/complaint-case-number";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const draftId = body.draftId ? String(body.draftId) : undefined;
  const payload = (body.payload ?? {}) as Record<string, unknown>;

  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });
  const auth = await requireSellerOrAdminForListing(listingId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    actorId: auth.userId ?? "unknown",
    actorType: auth.isAdmin ? "admin" : "seller",
  });
  if (blocked) return blocked;

  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId }, select: { ownerId: true } });
  const saved = await saveDeclarationDraft({
    draftId,
    listingId,
    sellerUserId: listing?.ownerId ?? null,
    adminUserId: auth.isAdmin ? auth.userId : null,
    payload,
  });

  await logAuditEvent({
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    entityType: "seller_declaration",
    entityId: saved.row.id,
    actionType: draftId ? "updated" : "created",
    moduleKey: "declarations",
    actorType: auth.isAdmin ? "admin" : "seller",
    actorId: auth.userId,
    linkedListingId: listingId,
    severity: "info",
    summary: draftId ? "Seller declaration draft updated" : "Seller declaration draft created",
    details: { status: saved.row.status, listingId },
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
