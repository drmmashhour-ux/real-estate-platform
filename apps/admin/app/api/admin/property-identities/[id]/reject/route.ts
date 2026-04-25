import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recordEvent } from "@/lib/property-identity/events";

/**
 * POST /api/admin/property-identities/:id/reject
 * Body: link_id, reason?
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const linkId = body.link_id as string;
    const reason = body.reason as string | undefined;

    if (!linkId) {
      return Response.json({ error: "link_id required" }, { status: 400 });
    }

    const link = await prisma.propertyIdentityLink.findFirst({
      where: { id: linkId, propertyIdentityId: id },
    });
    if (!link) {
      return Response.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.propertyIdentityLink.update({
      where: { id: linkId },
      data: { linkStatus: "rejected" },
    });

    await recordEvent(id, "listing_rejected", { link_id: linkId, reason, rejected_by: userId }, userId);

    return Response.json({ success: true, link_id: linkId });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Reject failed" },
      { status: 500 }
    );
  }
}
