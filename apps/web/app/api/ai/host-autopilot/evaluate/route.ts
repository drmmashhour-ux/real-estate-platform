import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getHostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { evaluateAutopilotActions, AUTOPILOT_EVALUATE_RATE_LIMIT_PER_HOUR } from "@/modules/host-ai";
import { logManagerAction } from "@/lib/ai/logger";
import { logAutopilotTagged } from "@/lib/server/launch-logger";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { isHostAutopilotRunApiEnabled } from "@/lib/ai/rollout-guards";

export const dynamic = "force-dynamic";

async function requireHost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) return null;
  return user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
}

/** Snapshot of governed autopilot suggestions — read-only, rate-limited, logged. */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireHost(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isHostAutopilotRunApiEnabled()) {
    return NextResponse.json({ error: "host_autopilot_api_disabled_by_env" }, { status: 403 });
  }

  const platform = await getManagerAiPlatformSettings();
  if (platform.globalKillSwitch || !platform.automationsEnabled) {
    return NextResponse.json({ error: "autopilot_disabled" }, { status: 403 });
  }

  const hourAgo = new Date(Date.now() - 3600000);
  const recentEvals = await prisma.managerAiActionLog.count({
    where: {
      userId,
      actionKey: "host_autopilot_evaluate_snapshot",
      createdAt: { gte: hourAgo },
    },
  });
  if (recentEvals >= AUTOPILOT_EVALUATE_RATE_LIMIT_PER_HOUR) {
    logAutopilotTagged.warn("action_suggested", {
      event: "rate_limited",
      hostId: userId,
      count: recentEvals,
    });
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: 3600, fallback: "manual" },
      { status: 429 }
    );
  }

  const cfg = await getHostAutopilotConfig(userId);

  const [listings, bookingsAwaitingApproval] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        city: true,
        nightPriceCents: true,
        photos: true,
        description: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.booking.findMany({
      where: {
        status: "AWAITING_HOST_APPROVAL",
        listing: { ownerId: userId },
      },
      select: {
        id: true,
        listingId: true,
        createdAt: true,
        totalCents: true,
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 12,
    }),
  ]);

  const result = evaluateAutopilotActions({
    config: cfg,
    listings,
    bookingsAwaitingApproval: bookingsAwaitingApproval.map((b) => ({
      id: b.id,
      listingId: b.listingId,
      listingTitle: b.listing.title,
      createdAt: b.createdAt,
      totalCents: b.totalCents,
    })),
  });

  await logManagerAction({
    userId,
    actionKey: "host_autopilot_evaluate_snapshot",
    targetEntityType: "host",
    targetEntityId: userId,
    status: "suggested",
    payload: {
      actionCount: result.actions.length,
      riskLevel: result.riskLevel,
      overallConfidence: result.overallConfidence,
    },
  });

  logAutopilotTagged.info("action_suggested", {
    hostId: userId,
    actionCount: result.actions.length,
    riskLevel: result.riskLevel,
    overallConfidence: result.overallConfidence,
    kinds: result.actions.map((a) => a.kind),
  });

  return NextResponse.json({
    evaluation: result,
    engine: "modules/host-ai/autopilot.engine",
  });
}
