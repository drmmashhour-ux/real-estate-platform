import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { formatAssistantChecklistMessage } from "@/lib/bnhub/host-verification-assistant";
import { getRequirementsForListingId } from "@/lib/bnhub/verification";
import { prisma } from "@repo/db";

/**
 * GET — Host preview of the same verification checklist admins see (plus assistant copy).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { listingId } = await params;
  const owned = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!owned || owned.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const packed = await getRequirementsForListingId(listingId);
  if (!packed) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    requirements: packed.requirements,
    assistantMessage: formatAssistantChecklistMessage(packed.row.title, packed.requirements),
    listingTitle: packed.row.title,
  });
}
