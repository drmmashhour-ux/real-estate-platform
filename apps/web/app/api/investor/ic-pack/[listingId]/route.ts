import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { isLecipmPhaseEnabled, logRolloutGate, withRolloutDisabledBody } from "@/lib/lecipm/rollout";
import { getLatestInvestorIcPack } from "@/modules/investor/investor-ic-pack.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import type { InvestorIcPackPayload } from "@/modules/investor/investor.types";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

const TAG = "[investor-ic-pack]";

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
    logRolloutGate(2, "/api/investor/ic-pack GET");
    return NextResponse.json(withRolloutDisabledBody(2, { icPack: null }));
  }

  const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: listingId });
  const boundaryBlock = await assertBrokeredTransaction(txCtx, "investor_packet", userId);
  if (boundaryBlock) return boundaryBlock;

  const pack = await getLatestInvestorIcPack(listingId);
  if (!pack) return NextResponse.json({ icPack: null });

  const payload = pack.payloadJson as InvestorIcPackPayload;
  return NextResponse.json({
    icPack: {
      id: pack.id,
      createdAt: pack.createdAt.toISOString(),
      version: pack.version,
      title: pack.title,
      decisionStage: pack.decisionStage,
      recommendation: pack.recommendation,
      confidenceLevel: pack.confidenceLevel,
      payload,
    },
  });
}
