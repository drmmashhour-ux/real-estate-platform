import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { parseTrustEngineTargetType } from "@/modules/trust-score/trust-score-api.helpers";
import { computePersistOperationalTrust } from "@/modules/trust-score/trust-score-history.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { targetType?: string; targetId?: string };
  try {
    body = (await request.json()) as { targetType?: string; targetId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const targetType = body.targetType ?? "";
  const targetId = body.targetId ?? "";
  if (!targetId || !parseTrustEngineTargetType(targetType)) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }

  try {
    const out = await computePersistOperationalTrust(prisma, targetType, targetId);
    return NextResponse.json({
      snapshotId: out.snapshotId,
      trustScore: out.result.trustScore,
      trustBand: out.result.trustBand,
      deltaFromPrior: out.deltaFromPrior,
      ranking: out.ranking,
      explain: out.result.explain,
    });
  } catch (e) {
    console.error("[api/admin/trust-score/compute]", e);
    return NextResponse.json({ error: "compute_failed" }, { status: 500 });
  }
}
