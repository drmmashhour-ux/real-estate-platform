import { NextResponse } from "next/server";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { recordGrowthAutonomyLearningEvent } from "@/modules/growth/growth-autonomy-learning.service";

export const dynamic = "force-dynamic";

export type GrowthAutonomyLearningEventBody = {
  suggestionId: string;
  categoryId: string;
  targetKey: string;
  kind:
    | "shown"
    | "interaction"
    | "prefill_used"
    | "completed"
    | "ignored"
    | "feedback_helpful"
    | "feedback_not_helpful"
    | "confusion";
  payload?: Record<string, unknown>;
};

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!growthAutonomyFlags.growthAutonomyLearningV1 || growthAutonomyFlags.growthAutonomyKillSwitch) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  try {
    const body = (await req.json()) as GrowthAutonomyLearningEventBody | null;
    if (!body?.suggestionId || !body.categoryId || !body.targetKey || !body.kind) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await recordGrowthAutonomyLearningEvent({
      suggestionId: body.suggestionId,
      categoryId: body.categoryId,
      targetKey: body.targetKey,
      operatorUserId: auth.userId,
      kind: body.kind,
      payload: body.payload,
    });
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ ok: true });
}
