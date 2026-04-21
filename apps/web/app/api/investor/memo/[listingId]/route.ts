import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { isLecipmPhaseEnabled, logRolloutGate, withRolloutDisabledBody } from "@/lib/lecipm/rollout";
import { getLatestInvestorMemo } from "@/modules/investor/investor-memo.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import type { InvestorMemoPayload } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

const TAG = "[investor-memo]";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const allowed = await userCanAccessInvestorDocuments(userId, listingId);
  if (!allowed) {
    logInfo(`${TAG} forbidden`, { listingId, userId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isLecipmPhaseEnabled(2)) {
    logRolloutGate(2, "/api/investor/memo GET");
    return NextResponse.json(withRolloutDisabledBody(2, { memo: null }));
  }

  const memo = await getLatestInvestorMemo(listingId);
  if (!memo) return NextResponse.json({ memo: null });

  const payload = memo.payloadJson as InvestorMemoPayload;
  return NextResponse.json({
    memo: {
      id: memo.id,
      createdAt: memo.createdAt.toISOString(),
      version: memo.version,
      memoType: memo.memoType,
      title: memo.title,
      recommendation: memo.recommendation,
      confidenceLevel: memo.confidenceLevel,
      payload,
    },
  });
}
