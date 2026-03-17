import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/property-identity/:id/history
 * Returns event history for the property identity.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      select: { id: true, links: { select: { linkedByUserId: true } } },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const canAccess =
      identity.links.some((l) => l.linkedByUserId === userId) ||
      (await prisma.shortTermListing.findFirst({
        where: { propertyIdentityId: id, ownerId: userId },
        select: { id: true },
      }));
    if (!canAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const events = await prisma.propertyIdentityEvent.findMany({
      where: { propertyIdentityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json({
      property_identity_id: id,
      events: events.map((e) => ({
        id: e.id,
        event_type: e.eventType,
        event_data: e.eventData,
        created_by: e.createdBy,
        created_at: e.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch history" },
      { status: 500 }
    );
  }
}
