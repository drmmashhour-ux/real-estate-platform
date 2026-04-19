import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import {
  resetGrowthAutonomyLearningWeights,
  setGrowthAutonomyLearningFrozen,
} from "@/modules/growth/growth-autonomy-learning.repository";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (auth.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!growthAutonomyFlags.growthAutonomyLearningV1) {
    return NextResponse.json({ error: "Learning disabled" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { action?: "reset_weights" | "freeze" | "unfreeze" };
    const action = body?.action;

    if (action === "reset_weights") {
      await resetGrowthAutonomyLearningWeights();
      return NextResponse.json({ ok: true });
    }
    if (action === "freeze") {
      await setGrowthAutonomyLearningFrozen(true);
      return NextResponse.json({ ok: true });
    }
    if (action === "unfreeze") {
      await setGrowthAutonomyLearningFrozen(false);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
