import { LecipmDisputeCaseEntityType } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { trainDisputePatternsFromHistory } from "@/modules/dispute-prediction/dispute-pattern-learning.service";
import { runDisputePrediction } from "@/modules/dispute-prediction/dispute-prediction.engine";

export const dynamic = "force-dynamic";

const ENTITY: LecipmDisputeCaseEntityType[] = ["BOOKING", "DEAL", "LISTING", "PAYMENT"];

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { entityType?: string; entityId?: string; trainPatterns?: boolean; executePrevention?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.trainPatterns) {
    const trained = await trainDisputePatternsFromHistory();
    return NextResponse.json({ ok: true, trained });
  }

  const entityType =
    typeof body.entityType === "string" && (ENTITY as string[]).includes(body.entityType) ?
      (body.entityType as LecipmDisputeCaseEntityType)
    : null;
  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType_and_entityId_required" }, { status: 400 });
  }

  try {
    const prediction = await runDisputePrediction({
      entityType,
      entityId,
      persist: true,
      executePrevention: Boolean(body.executePrevention),
    });
    return NextResponse.json({ ok: true, prediction });
  } catch (e) {
    console.error("[admin/dispute-prediction/evaluate]", e);
    return NextResponse.json({ error: "evaluate_failed" }, { status: 500 });
  }
}
