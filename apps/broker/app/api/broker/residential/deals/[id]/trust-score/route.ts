import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";
import { snapshotToPayload } from "@/modules/trust-score/trust-score-api.helpers";
import {
  computePersistOperationalTrust,
  getLatestOperationalTrustSnapshot,
  getOperationalTrustHistory,
} from "@/modules/trust-score/trust-score-history.service";
import { operationalTrustRankingModifier } from "@/modules/trust-score/trust-score-ranking.service";

export const dynamic = "force-dynamic";

/** Broker-accessible operational trust for a residential deal file. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Broker access only" }, { status: 403 });
  }

  const { id: dealId } = await ctx.params;
  const deal = await requireBrokerDealAccess(userId, dealId, user.role === PlatformRole.ADMIN);
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    let snap = await getLatestOperationalTrustSnapshot(prisma, "DEAL", dealId);
    if (!snap || refresh) {
      await computePersistOperationalTrust(prisma, "DEAL", dealId);
      snap = await getLatestOperationalTrustSnapshot(prisma, "DEAL", dealId);
    }
    if (!snap) {
      return NextResponse.json({ error: "snapshot_unavailable" }, { status: 404 });
    }

    const history = await getOperationalTrustHistory(prisma, "DEAL", dealId, 12);
    const ranking = operationalTrustRankingModifier(snap.trustScore, snap.trustBand, true);

    return NextResponse.json({
      targetType: "DEAL" as const,
      targetId: dealId,
      snapshot: snapshotToPayload(snap),
      history,
      ranking,
      advisoryFooter:
        "Operational trust supports prioritization — not a substitute for regulatory or legal review.",
    });
  } catch (e) {
    console.error("[api/broker/residential/deals/trust-score]", e);
    return NextResponse.json({ error: "trust_score_failed" }, { status: 500 });
  }
}
