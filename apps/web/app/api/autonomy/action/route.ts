import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { isAutonomyOsActionsEnabled } from "@/modules/autonomy/lib/autonomy-layer-gate";
import { persistAutonomyProposedAction } from "@/modules/autonomy/api/autonomy-os-persist.service";
import { createProposedAction } from "@/modules/autonomy/engine/autonomy-orchestrator.service";
import { logAutonomy } from "@/modules/autonomy/lib/autonomy-log";

export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isAutonomyOsActionsEnabled()) {
    return NextResponse.json(
      { error: "Autonomy actions API is disabled (FEATURE_AUTONOMY_CORE_V1 + FEATURE_AUTONOMY_ACTIONS_V1)." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as Parameters<typeof createProposedAction>[0];

  const action = createProposedAction(body);

  logAutonomy("[autonomy:action:created]", { actionId: action.id, status: action.status });

  await persistAutonomyProposedAction(action);

  return NextResponse.json({
    success: true,
    action,
  });
}
