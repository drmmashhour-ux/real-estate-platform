import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { snapshotToPayload } from "@/modules/trust-score/trust-score-api.helpers";
import {
  computePersistOperationalTrust,
  getLatestOperationalTrustSnapshot,
  getOperationalTrustHistory,
} from "@/modules/trust-score/trust-score-history.service";
import { operationalTrustRankingModifier } from "@/modules/trust-score/trust-score-ranking.service";

export const dynamic = "force-dynamic";

/** Broker-scoped operational trust for the signed-in broker user (BROKER target). */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Broker access only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    let snap = await getLatestOperationalTrustSnapshot(prisma, "BROKER", userId);
    if (!snap || refresh) {
      await computePersistOperationalTrust(prisma, "BROKER", userId);
      snap = await getLatestOperationalTrustSnapshot(prisma, "BROKER", userId);
    }
    if (!snap) {
      return NextResponse.json({ error: "snapshot_unavailable" }, { status: 404 });
    }

    const history = await getOperationalTrustHistory(prisma, "BROKER", userId, 14);
    const ranking = operationalTrustRankingModifier(snap.trustScore, snap.trustBand, true);

    return NextResponse.json({
      targetType: "BROKER" as const,
      targetId: userId,
      snapshot: snapshotToPayload(snap),
      history,
      ranking,
      advisoryFooter:
        "This score summarizes operational signals for prioritization — not legal fault or moral judgment.",
    });
  } catch (e) {
    console.error("[api/broker/trust-score]", e);
    return NextResponse.json({ error: "trust_score_failed" }, { status: 500 });
  }
}
