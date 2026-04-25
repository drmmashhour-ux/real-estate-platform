import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recordEvent } from "@/lib/property-identity/events";

/**
 * POST /api/admin/property-identities/:id/approve
 * Body: link_id (optional) – if provided, set that link to active and update listing's propertyIdentityId.
 *        If not provided, no link change (general "approve identity" for manual review).
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
    const linkId = body.link_id as string | undefined;

    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    if (linkId) {
      const link = await prisma.propertyIdentityLink.findFirst({
        where: { id: linkId, propertyIdentityId: id },
      });
      if (!link) {
        return Response.json({ error: "Link not found" }, { status: 404 });
      }
      await prisma.propertyIdentityLink.update({
        where: { id: linkId },
        data: { linkStatus: "active" },
      });
      if (link.listingType === "short_term_rental") {
        await prisma.shortTermListing.update({
          where: { id: link.listingId },
          data: { propertyIdentityId: id },
        });
      }
      await recordEvent(id, "listing_linked", { link_id: linkId, approved_by: userId }, userId);
    }

    return Response.json({ success: true, link_id: linkId ?? null });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Approve failed" },
      { status: 500 }
    );
  }
}
