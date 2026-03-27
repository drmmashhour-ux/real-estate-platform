import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { generateTrustScore } from "@/src/modules/bnhub/application/trustEntityService";

export const dynamic = "force-dynamic";

/**
 * POST { entityType: listing|host|guest, entityId }
 * Host may refresh own listing/host; guest own profile; admin any.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { entityType?: string; entityId?: string };
  const entityType = body.entityType;
  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  if (entityType !== "listing" && entityType !== "host" && entityType !== "guest") {
    return Response.json({ error: "entityType must be listing, host, or guest" }, { status: 400 });
  }
  if (!entityId) return Response.json({ error: "entityId required" }, { status: 400 });

  const admin = await isPlatformAdmin(userId);
  if (entityType === "listing") {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: entityId },
      select: { ownerId: true },
    });
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    if (!admin && listing.ownerId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entityType === "host") {
    if (!admin && entityId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entityType === "guest") {
    if (!admin && entityId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const out = await generateTrustScore({ entityType, entityId });
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
