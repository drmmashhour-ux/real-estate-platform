import { NextResponse } from "next/server";

import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { undoGrowthAutonomyLowRiskExecution } from "@/modules/growth/growth-autonomy-execution.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (growthAutonomyFlags.growthAutonomyKillSwitch || !growthAutonomyFlags.growthAutonomyAutoLowRiskV1) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let auditId = "";
  try {
    const b = (await req.json()) as { auditId?: string };
    auditId = typeof b?.auditId === "string" ? b.auditId : "";
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }

  if (!auditId) {
    return NextResponse.json({ ok: false, message: "auditId required." }, { status: 400 });
  }

  const ok = await undoGrowthAutonomyLowRiskExecution({ auditId, operatorUserId: auth.userId });
  return NextResponse.json({ ok });
}
