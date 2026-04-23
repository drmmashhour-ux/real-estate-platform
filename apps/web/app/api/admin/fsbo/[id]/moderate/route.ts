import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { FSBO_STATUS } from "@/lib/fsbo/constants";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { notifyFsboListingActivatedIfNeeded } from "@/lib/listing-lifecycle/notify-fsbo-listing-activated";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";

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

  return Response.json({ ok: true });
}
