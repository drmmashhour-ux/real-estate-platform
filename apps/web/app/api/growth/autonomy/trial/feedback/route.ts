import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import {
  defaultAdjacentTrialActionId,
  normalizeGrowthAutonomyTrialFeedbackKind,
  recordGrowthAutonomyTrialOperatorFeedback,
} from "@/modules/growth/growth-autonomy-trial-feedback.service";
import { ADJACENT_INTERNAL_TRIAL_ACTION_TYPE } from "@/modules/growth/growth-autonomy-trial-boundaries";
import { viewerReceivesGrowthAutonomySnapshotInternal } from "@/modules/growth/growth-autonomy-internal-access";

export const dynamic = "force-dynamic";

function mayPostFeedback(args: { role: PlatformRole; userId: string }): boolean {
  if (args.role === PlatformRole.ADMIN) return true;
  return viewerReceivesGrowthAutonomySnapshotInternal({
    role: args.role,
    userId: args.userId,
    debugRequest: false,
  });
}

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!growthAutonomyFlags.growthAutonomyTrialV1) {
    return NextResponse.json({ ok: false, message: "Trial feedback disabled." }, { status: 403 });
  }

  if (!mayPostFeedback({ role: auth.role, userId: auth.userId })) {
    return NextResponse.json({ ok: false, message: "Insufficient privilege." }, { status: 403 });
  }

  let body: { kind?: string; trialActionId?: string; notes?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const kind = normalizeGrowthAutonomyTrialFeedbackKind(body.kind ?? "");
  if (!kind) {
    return NextResponse.json({ ok: false, message: "Unknown feedback kind." }, { status: 400 });
  }

  const trialActionId = typeof body.trialActionId === "string" ? body.trialActionId : defaultAdjacentTrialActionId();

  recordGrowthAutonomyTrialOperatorFeedback({
    trialActionId,
    candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    kind,
    actorUserId: auth.userId,
    notes: typeof body.notes === "string" ? body.notes : null,
  });

  return NextResponse.json({ ok: true });
}
