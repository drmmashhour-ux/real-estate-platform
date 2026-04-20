import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { isAutonomyOsLearningEnabled } from "@/modules/autonomy/lib/autonomy-layer-gate";
import { logAutonomy } from "@/modules/autonomy/lib/autonomy-log";
import { buildLearningSnapshot } from "@/modules/autonomy/learning/learning-engine.service";
import { listOutcomeEvents } from "@/modules/autonomy/learning/outcome-tracking.service";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isAutonomyOsLearningEnabled()) {
    return NextResponse.json(
      { error: "Autonomy learning loop is disabled (FEATURE_AUTONOMY_CORE_V1 + FEATURE_LEARNING_LOOP_V1)." },
      { status: 503 },
    );
  }

  const events = listOutcomeEvents();
  const snapshot = buildLearningSnapshot(events);

  logAutonomy("[autonomy:learning:update]", { events: events.length });

  return NextResponse.json({
    success: true,
    snapshot,
    events,
  });
}
