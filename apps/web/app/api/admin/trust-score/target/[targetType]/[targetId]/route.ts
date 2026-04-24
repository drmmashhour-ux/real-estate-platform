import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { snapshotToPayload, parseTrustEngineTargetType } from "@/modules/trust-score/trust-score-api.helpers";
import {
  computePersistOperationalTrust,
  getLatestOperationalTrustSnapshot,
  getOperationalTrustHistory,
} from "@/modules/trust-score/trust-score-history.service";
import { operationalTrustRankingModifier } from "@/modules/trust-score/trust-score-ranking.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ targetType: string; targetId: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { targetType: rawType, targetId } = await ctx.params;
  if (!parseTrustEngineTargetType(rawType)) {
    return NextResponse.json({ error: "invalid_target_type" }, { status: 400 });
  }

  const url = new URL(_request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    let snap = await getLatestOperationalTrustSnapshot(prisma, rawType, targetId);
    if (!snap || refresh) {
      await computePersistOperationalTrust(prisma, rawType, targetId);
      snap = await getLatestOperationalTrustSnapshot(prisma, rawType, targetId);
    }
    if (!snap) {
      return NextResponse.json({ error: "snapshot_unavailable" }, { status: 404 });
    }

    const history = await getOperationalTrustHistory(prisma, rawType, targetId, 18);
    const ranking = operationalTrustRankingModifier(snap.trustScore, snap.trustBand, true);

    return NextResponse.json({
      targetType: rawType,
      targetId,
      snapshot: snapshotToPayload(snap),
      history,
      ranking,
      advisoryFooter:
        "Operational trust is non-punitive by default — combine with policy review for high-impact automation.",
    });
  } catch (e) {
    console.error("[api/admin/trust-score/target]", e);
    return NextResponse.json({ error: "trust_target_failed" }, { status: 500 });
  }
}
