import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createScenarioAutopilotRun } from "@/modules/scenario-autopilot/scenario-autopilot-run.service";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const payload = await createScenarioAutopilotRun(auth.userId, user.role);
  return NextResponse.json({
    id: payload.id,
    status: payload.status,
    ranking: payload.ranking,
    approvalPayload: payload.approvalPayload,
    whyApproval: payload.whyApproval,
    successPreview: payload.successPreview,
  });
}
