import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getEsgActionCenterBundle, userCanAccessEsgActionCenter } from "@/modules/esg/esg-action-center.service";
import { logInfo } from "@/lib/logger";
import { isLecipmPhaseEnabled, lecipmRolloutDisabledMeta, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

const TAG = "[esg-actions]";

/**
 * GET /api/esg/actions?listingId= — compact ESG action center (same domain data as /api/esg/action-center/[listingId]).
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  if (!isLecipmPhaseEnabled(1)) {
    logRolloutGate(1, "/api/esg/actions");
    return NextResponse.json({
      listingId,
      actions: [],
      summary: null,
      rollout: lecipmRolloutDisabledMeta(1),
    });
  }

  const ok = await userCanAccessEsgActionCenter(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bundle = await getEsgActionCenterBundle(listingId);
  logInfo(`${TAG} get`, { listingId });
  return NextResponse.json(bundle);
}
