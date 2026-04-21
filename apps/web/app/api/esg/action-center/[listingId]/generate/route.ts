import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  generateEsgActionsForListing,
  userCanAccessEsgActionCenter,
} from "@/modules/esg/esg-action-center.service";
import {
  captureRetrofitUpstreamFingerprint,
  scheduleDebouncedRetrofitUpstreamRefresh,
} from "@/modules/esg/esg-retrofit-upstream-refresh";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-action-generate]";

export async function POST(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await userCanAccessEsgActionCenter(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const fpBefore = await captureRetrofitUpstreamFingerprint(listingId);
    const result = await generateEsgActionsForListing(listingId);
    scheduleDebouncedRetrofitUpstreamRefresh(listingId, "evidence", fpBefore);
    logInfo(`${TAG} api`, { listingId, ...result });
    return NextResponse.json({
      generated: result.generated,
      actionCount: result.actionCount,
      criticalCount: result.criticalCount,
    });
  } catch {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
