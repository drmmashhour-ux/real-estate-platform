import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { persistAutonomyOutcome } from "@/modules/autonomy/api/autonomy-os-persist.service";
import { isAutonomyOsLearningEnabled } from "@/modules/autonomy/lib/autonomy-layer-gate";
import { logAutonomy } from "@/modules/autonomy/lib/autonomy-log";
import { recordOutcomeEvent } from "@/modules/autonomy/learning/outcome-tracking.service";
import type { OutcomeEvent } from "@/modules/autonomy/types/autonomy.types";

export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isAutonomyOsLearningEnabled()) {
    return NextResponse.json(
      { error: "Outcome recording requires FEATURE_AUTONOMY_CORE_V1 + FEATURE_LEARNING_LOOP_V1." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as Partial<OutcomeEvent>;

  const requiredMissing =
    body.domain === undefined ||
    body.metric === undefined ||
    body.entityId === undefined ||
    body.entityType === undefined ||
    body.label === undefined ||
    body.actionId === undefined ||
    body.actionId === null;

  if (requiredMissing) {
    return NextResponse.json(
      { error: "Required: domain, metric, entityId, entityType, label, actionId" },
      { status: 400 },
    );
  }

  const event: OutcomeEvent = {
    id:
      body.id ??
      (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `out-${Date.now()}`),
    actionId: body.actionId as string,
    entityId: body.entityId as string,
    entityType: body.entityType as OutcomeEvent["entityType"],
    domain: body.domain as OutcomeEvent["domain"],
    metric: body.metric as string,
    beforeValue: body.beforeValue,
    afterValue: body.afterValue,
    delta: body.delta,
    label: body.label as OutcomeEvent["label"],
    observedAt: body.observedAt ?? new Date().toISOString(),
    notes: body.notes,
  };

  recordOutcomeEvent(event);
  await persistAutonomyOutcome(event);

  logAutonomy("[autonomy:learning:update]", { outcomeId: event.id, metric: event.metric });

  return NextResponse.json({ success: true, event });
}
