import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { FSBO_STATUS } from "@/lib/fsbo/constants";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { notifyFsboListingActivatedIfNeeded } from "@/lib/listing-lifecycle/notify-fsbo-listing-activated";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { COMPLAINT_PLATFORM_OWNER_ID } from "@/lib/compliance/complaint-case-number";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(request, {
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    actorId: userId,
    actorType: "admin",
  });
  if (blocked) return blocked;

  const { id } = await context.params;
  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
  if (!action) {
    return Response.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const row = await prisma.fsboListing.findUnique({
    where: { id },
    select: { id: true, status: true, ownerId: true },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "approve") {
    if (row.status === FSBO_STATUS.PENDING_VERIFICATION) {
      const legalBlock = await maybeBlockRequestWithLegalGate({
        action: "publish_listing",
        userId: row.ownerId,
        actorType: "seller",
      });
      if (legalBlock) return legalBlock;

      await prisma.fsboListing.update({
        where: { id },
        data: {
          moderationStatus: "APPROVED",
          rejectReason: null,
          status: FSBO_STATUS.ACTIVE,
          paidPublishAt: new Date(),
        },
      });
    } else {
      await prisma.fsboListing.update({
        where: { id },
        data: {
          moderationStatus: "APPROVED",
          rejectReason: null,
        },
      });
    }
  } else {
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 2000)
        : null;
    await prisma.fsboListing.update({
      where: { id },
      data: {
        moderationStatus: "REJECTED",
        rejectReason: reason,
        status: FSBO_STATUS.DRAFT,
      },
    });
  }

  await persistSellerDeclarationAiReview(id);
  await syncFsboListingExpiryState(id, { sendReminder: false }).catch(() => null);

  if (action === "approve") {
    void notifyFsboListingActivatedIfNeeded(id).catch(() => null);
  }

  const auditAction =
    action === "reject"
      ? row.status === FSBO_STATUS.PENDING_VERIFICATION
        ? "listing_publication_blocked"
        : "refused"
      : row.status === FSBO_STATUS.PENDING_VERIFICATION
        ? "validated"
        : "admin_approved";

  await logAuditEvent({
    ownerType: "platform",
    ownerId: COMPLAINT_PLATFORM_OWNER_ID,
    entityType: "seller_declaration",
    entityId: id,
    actionType: auditAction,
    moduleKey: "declarations",
    actorType: "admin",
    actorId: userId,
    linkedListingId: id,
    severity: action === "reject" ? "high" : "info",
    summary:
      action === "reject"
        ? "Listing publication blocked or declaration refused by moderator"
        : "Listing / declaration validated or approved by moderator",
    details: {
      action,
      priorStatus: row.status,
      rejectReason:
        action === "reject"
          ? typeof body.reason === "string" && body.reason.trim()
            ? body.reason.trim().slice(0, 2000)
            : null
          : null,
    },
  });

  return Response.json({ ok: true });
}
