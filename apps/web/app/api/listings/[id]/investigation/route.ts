import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { monolithPrisma } from "@/lib/db/monolith-client";

/**
 * GET /api/listings/:id/investigation
 * Returns the open or most recent investigation for this listing (if any).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId(); // optional: public could be 404 for no-auth
    const { id: listingId } = await context.params;

    const investigation = await monolithPrisma.listingInvestigation.findFirst({
      where: { listingId },
      orderBy: { openedAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            listingStatus: true,
            city: true,
          },
        },
      },
    });

    if (!investigation) {
      return Response.json({ investigation: null }, { status: 200 });
    }

    return Response.json({ investigation });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch investigation" }, { status: 500 });
  }
}
