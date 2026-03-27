import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export const dynamic = "force-dynamic";

/** PATCH — admin disable a specific listing’s offer (risk / abuse). */
export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { listingServiceId?: string; adminDisabled?: boolean };
  if (!body.listingServiceId || body.adminDisabled === undefined) {
    return Response.json({ error: "listingServiceId and adminDisabled required" }, { status: 400 });
  }
  const row = await prisma.bnhubListingService.update({
    where: { id: body.listingServiceId },
    data: { adminDisabled: body.adminDisabled },
    include: { service: true, listing: { select: { id: true, title: true } } },
  });
  await prisma.bnhubSafetyAuditLog.create({
    data: {
      listingId: row.listingId,
      actorUserId: userId,
      actionType: "hospitality_listing_offer_admin_toggle",
      payloadJson: {
        listingServiceId: row.id,
        adminDisabled: row.adminDisabled,
      },
    },
  });
  return Response.json({ offer: row });
}
