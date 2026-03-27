import { NextRequest } from "next/server";
import { getTrustScore, getTrustScoreForUser, getTrustScoreForListing } from "@/lib/ai";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export const dynamic = "force-dynamic";

async function captureTrustgraphRun(args: {
  entityType: "listing" | "user";
  entityId: string;
  trustScore: number;
}): Promise<void> {
  const sessionUser = await getGuestId();
  let distinctId: string | null = sessionUser;
  if (!distinctId && args.entityType === "listing") {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: args.entityId },
      select: { ownerId: true },
    });
    distinctId = row?.ownerId ?? null;
  }
  if (!distinctId) {
    distinctId = args.entityType === "user" ? args.entityId : null;
  }
  if (!distinctId) return;
  captureServerEvent(distinctId, AnalyticsEvents.TRUSTGRAPH_RUN, {
    listingId: args.entityType === "listing" ? args.entityId : undefined,
    trustScore: args.trustScore,
  });
}

/** POST /api/ai/trust-score – get trust score for user or listing. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, listingId, entityType, entityId, recompute } = body as {
      userId?: string;
      listingId?: string;
      entityType?: string;
      entityId?: string;
      recompute?: boolean;
    };
    const eType = entityType ?? (listingId ? "listing" : "user");
    const eId = entityId ?? listingId ?? userId;
    if (!eId) {
      return Response.json(
        { error: "userId, listingId, or (entityType + entityId) required" },
        { status: 400 }
      );
    }
    const resolvedEntityType: "listing" | "user" = eType === "listing" ? "listing" : "user";
    const result = await getTrustScore({
      entityType: resolvedEntityType,
      entityId: eId,
      recompute: !!recompute,
      log: true,
    });
    await captureTrustgraphRun({
      entityType: resolvedEntityType,
      entityId: eId,
      trustScore: result.trustScore,
    });
    return Response.json({
      trustScore: result.trustScore,
      trustLevel: result.trustLevel,
      source: result.source,
      details: result.details,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trust score failed";
    if (msg.includes("not found")) {
      return Response.json({ error: msg }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Failed to get trust score" }, { status: 500 });
  }
}

/** GET /api/ai/trust-score?userId=... or ?listingId=... */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const listingId = searchParams.get("listingId");
  const recompute = searchParams.get("recompute") === "true";
  if (!userId && !listingId) {
    return Response.json(
      { error: "query param userId or listingId required" },
      { status: 400 }
    );
  }
  try {
    const result = userId
      ? await getTrustScoreForUser(userId, { recompute, log: true })
      : await getTrustScoreForListing(listingId!, { log: true });
    if (userId) {
      await captureTrustgraphRun({ entityType: "user", entityId: userId, trustScore: result.trustScore });
    } else if (listingId) {
      await captureTrustgraphRun({ entityType: "listing", entityId: listingId, trustScore: result.trustScore });
    }
    return Response.json({
      trustScore: result.trustScore,
      trustLevel: result.trustLevel,
      source: result.source,
      details: result.details,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trust score failed";
    if (msg.includes("not found")) {
      return Response.json({ error: msg }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Failed to get trust score" }, { status: 500 });
  }
}
