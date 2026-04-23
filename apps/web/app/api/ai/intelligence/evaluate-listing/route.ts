import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { evaluateListingForAutopilot } from "@/lib/ai/autopilot/evaluateListingForAutopilot";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** POST { listingId } — host or admin evaluation (listing must be owned by caller unless admin). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin && listing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await evaluateListingForAutopilot(listingId);
  return Response.json({ ok: true, result });
}
