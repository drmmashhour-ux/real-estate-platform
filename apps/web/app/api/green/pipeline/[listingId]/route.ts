import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { pipelineLog } from "@/modules/green-ai/pipeline/pipeline-logger";
import { isSubsidyPipelineStage } from "@/modules/green-ai/pipeline/upgrade-flow";

export const dynamic = "force-dynamic";

/**
 * PATCH — advance green pipeline stage for an FSBO listing (owner-only).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await ctx.params;
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawStage = body.stage;
  if (typeof rawStage !== "string" || !isSubsidyPipelineStage(rawStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }
  const stage = rawStage;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.greenProject.upsert({
    where: { fsboListingId: listingId },
    create: {
      fsboListingId: listingId,
      stage,
    },
    update: { stage },
  });

  pipelineLog.info("stage_updated", { listingId, stage });

  return NextResponse.json({
    id: updated.id,
    fsboListingId: updated.fsboListingId,
    stage: updated.stage,
    estimatedGrant: updated.estimatedGrant,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
