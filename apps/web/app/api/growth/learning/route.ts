import { NextResponse } from "next/server";
import { growthLearningFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { runGrowthLearningCycle } from "@/modules/growth/growth-learning.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthLearningFlags.growthLearningV1) {
    return NextResponse.json({ error: "Growth learning disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const result = await runGrowthLearningCycle();
  if (!result) {
    return NextResponse.json({ error: "Growth learning unavailable" }, { status: 503 });
  }

  return NextResponse.json(result);
}
