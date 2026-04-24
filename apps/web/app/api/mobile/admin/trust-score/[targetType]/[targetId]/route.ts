import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
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
  request: Request,
  ctx: { params: Promise<{ targetType: string; targetId: string }> },
) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { targetType: rawType, targetId } = await ctx.params;
  if (!parseTrustEngineTargetType(rawType)) {
    return NextResponse.json({ error: "invalid_target_type" }, { status: 400 });
  }

  const url = new URL(request.url);
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

    const explain = snap.explainJson as {
      topPositive?: string[];
      topNegative?: string[];
      improvements?: string[];
      declineNote?: string;
    };

    const history = await getOperationalTrustHistory(prisma, rawType, targetId, 8);
    const ranking = operationalTrustRankingModifier(snap.trustScore, snap.trustBand, true);

    return NextResponse.json({
      targetType: rawType,
      targetId,
      score: snap.trustScore,
      band: snap.trustBand,
      topReasons: [...(explain.topPositive ?? []).slice(0, 3), ...(explain.topNegative ?? []).slice(0, 3)],
      deltaFromPrior: snap.deltaFromPrior,
      actionSuggestions: (explain.improvements ?? []).slice(0, 6),
      declineNote: explain.declineNote,
      history: history.map((h) => ({
        score: h.trustScore,
        band: h.trustBand,
        delta: h.deltaFromPrior,
        at: h.createdAt,
      })),
      ranking,
      snapshot: snapshotToPayload(snap),
    });
  } catch (e) {
    console.error("[mobile/admin/trust-score/detail]", e);
    return NextResponse.json({ error: "detail_failed" }, { status: 500 });
  }
}
