import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { reputationEngineFlags } from "@/config/feature-flags";
import { buildHostTrustSnapshot } from "@/modules/trust-scores/host-trust-score.service";
import { buildHostImprovementPlan } from "@/modules/reputation/host-improvement.service";
import { schedulePersistHostTrustSnapshot } from "@/modules/reputation/snapshot-writer.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: hostUserId } = await ctx.params;
  if (!hostUserId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!reputationEngineFlags.reputationEngineV1) {
    return NextResponse.json({ error: "Reputation engine disabled" }, { status: 403 });
  }

  const viewer = await getGuestId();
  if (!viewer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const viewerRow = await prisma.user.findUnique({ where: { id: viewer }, select: { role: true } });
  const isAdmin = viewerRow?.role === "ADMIN";
  if (viewer !== hostUserId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trust = await buildHostTrustSnapshot(hostUserId);
  schedulePersistHostTrustSnapshot(hostUserId, trust);

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  let improvement = null;
  if (listingId) {
    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: hostUserId },
      select: { id: true },
    });
    if (listing) {
      improvement = await buildHostImprovementPlan(listing.id, hostUserId);
    }
  }

  return NextResponse.json({
    hostUserId,
    trust,
    improvement,
  });
}
