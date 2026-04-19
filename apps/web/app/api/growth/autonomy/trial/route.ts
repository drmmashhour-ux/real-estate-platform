import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { ADJACENT_INTERNAL_TRIAL_ACTION_ID, ADJACENT_INTERNAL_TRIAL_ACTION_TYPE } from "@/modules/growth/growth-autonomy-trial-boundaries";
import { appendGrowthAutonomyTrialAudit } from "@/modules/growth/growth-autonomy-trial-audit.service";
import { rollbackGrowthAutonomyTrial } from "@/modules/growth/growth-autonomy-trial-rollback.service";
import {
  getGrowthAutonomyTrialApprovalRecord,
  setGrowthAutonomyTrialApprovalRecord,
} from "@/modules/growth/growth-autonomy-trial-state.repository";
import type { GrowthAutonomyTrialApprovalRecord } from "@/modules/growth/growth-autonomy-trial.types";
import { parseGrowthAutonomyRolloutFromEnv } from "@/modules/growth/growth-autonomy-config";
import { viewerReceivesGrowthAutonomySnapshotInternal } from "@/modules/growth/growth-autonomy-internal-access";
import {
  recordGrowthAutonomyTrialApprovalRecorded,
  recordGrowthAutonomyTrialDenialRecorded,
  recordGrowthAutonomyTrialKillFreezeBlock,
} from "@/modules/growth/growth-autonomy-monitoring.service";

export const dynamic = "force-dynamic";

function mayMutateTrial(args: { role: PlatformRole; userId: string }): boolean {
  if (args.role === PlatformRole.ADMIN) return true;
  return viewerReceivesGrowthAutonomySnapshotInternal({
    role: args.role,
    userId: args.userId,
    debugRequest: false,
  });
}

type Body = {
  decision: "approve" | "deny" | "rollback";
  trialActionId?: string;
  evidenceSummary?: string;
  notes?: string;
};

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!mayMutateTrial({ role: auth.role, userId: auth.userId })) {
    return NextResponse.json({ error: "Insufficient privilege for trial mutation" }, { status: 403 });
  }

  if (!growthAutonomyFlags.growthAutonomyTrialV1) {
    return NextResponse.json({ error: "FEATURE_GROWTH_AUTONOMY_TRIAL_V1 is off" }, { status: 403 });
  }

  if (growthAutonomyFlags.growthAutonomyKillSwitch) {
    return NextResponse.json({ error: "Growth autonomy kill switch blocks trial mutation" }, { status: 403 });
  }

  const rolloutStage = parseGrowthAutonomyRolloutFromEnv();
  if (rolloutStage !== "internal") {
    return NextResponse.json(
      { error: "Trial approvals only when FEATURE_GROWTH_AUTONOMY_ROLLOUT=internal" },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const trialActionId = body.trialActionId ?? "";

  if (body.decision === "approve") {
    if (trialActionId !== ADJACENT_INTERNAL_TRIAL_ACTION_ID) {
      return NextResponse.json({ error: "trialActionId does not match the single adjacent trial catalog entry" }, { status: 400 });
    }

    if (growthAutonomyFlags.growthAutonomyTrialFreeze) {
      try {
        recordGrowthAutonomyTrialKillFreezeBlock();
      } catch {
        /* noop */
      }
      return NextResponse.json({ error: "FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE is on — no new approvals" }, { status: 403 });
    }

    const existing = getGrowthAutonomyTrialApprovalRecord();
    if (
      existing &&
      (existing.activationStatus === "approved_internal_trial" || existing.activationStatus === "active")
    ) {
      return NextResponse.json({ error: "Only one trial may be pending or active — roll back before re-approving" }, { status: 409 });
    }

    const record: GrowthAutonomyTrialApprovalRecord = {
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      evidenceSummary: body.evidenceSummary ?? "operator_manual_approval",
      approvedBy: auth.userId,
      approvedAt: new Date().toISOString(),
      activationStatus: "approved_internal_trial",
      rollbackStatus: "none",
      notes: body.notes ?? null,
      executionArtifactId: null,
    };

    setGrowthAutonomyTrialApprovalRecord(record);
    appendGrowthAutonomyTrialAudit({
      kind: "approved",
      trialActionId: record.trialActionId,
      candidateActionType: record.candidateActionType,
      actorUserId: auth.userId,
      evidenceSummary: record.evidenceSummary,
      notes: record.notes ?? undefined,
    });
    try {
      recordGrowthAutonomyTrialApprovalRecorded();
    } catch {
      /* noop */
    }

    return NextResponse.json({ ok: true, approval: record });
  }

  if (body.decision === "deny") {
    const existing = getGrowthAutonomyTrialApprovalRecord();
    appendGrowthAutonomyTrialAudit({
      kind: "denied",
      trialActionId: existing?.trialActionId ?? ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      actorUserId: auth.userId,
      notes: body.notes ?? undefined,
    });
    setGrowthAutonomyTrialApprovalRecord(null);
    try {
      recordGrowthAutonomyTrialDenialRecorded();
    } catch {
      /* noop */
    }
    return NextResponse.json({ ok: true });
  }

  if (body.decision === "rollback") {
    const res = rollbackGrowthAutonomyTrial({ actorUserId: auth.userId, notes: body.notes });
    if (!res.ok) {
      return NextResponse.json({ error: res.reason ?? "Rollback failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
}
