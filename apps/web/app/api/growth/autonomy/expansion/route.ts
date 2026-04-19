import { NextResponse } from "next/server";

import { PlatformRole } from "@prisma/client";

import { growthAutonomyFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { getExpansionCandidateById } from "@/modules/growth/growth-autonomy-expansion-candidates";
import {
  evaluateGrowthAutonomyExpansionLandscape,
} from "@/modules/growth/growth-autonomy-expansion.service";
import {
  getGrowthAutonomyExpansionMonitoringSnapshot,
} from "@/modules/growth/growth-autonomy-expansion-monitoring.service";
import {
  getGrowthAutonomyExpansionState,
  saveGrowthAutonomyExpansionState,
} from "@/modules/growth/growth-autonomy-expansion.repository";
import { evaluateAdjacentTrialExpansionGovernanceLock } from "@/modules/growth/growth-autonomy-trial-expansion-lock.service";
import {
  computeGrowthAutonomyTrialOutcomeSummary,
  hasAdjacentTrialExecutionInAudit,
} from "@/modules/growth/growth-autonomy-trial-results.service";
import { getGrowthAutonomyTrialOutcomeSummary } from "@/modules/growth/growth-autonomy-trial-results-state.repository";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!growthAutonomyFlags.growthAutonomyExpansionV1 && !growthAutonomyFlags.growthAutonomyExpansionPanelV1) {
    return NextResponse.json({ ok: false, message: "Expansion framework disabled." }, { status: 403 });
  }

  const url = new URL(req.url);
  const debugReq =
    url.searchParams.get("growthAutonomyDebug") === "1" ||
    url.searchParams.get("growth_autonomy_debug") === "1" ||
    process.env.NODE_ENV !== "production";

  const report = await evaluateGrowthAutonomyExpansionLandscape();
  const monitoring =
    debugReq ? { expansionMonitoring: getGrowthAutonomyExpansionMonitoringSnapshot() } : {};

  return NextResponse.json({ ok: true, report, ...monitoring });
}

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (auth.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, message: "Admin only." }, { status: 403 });
  }

  if (
    growthAutonomyFlags.growthAutonomyExpansionFreeze ||
    !(growthAutonomyFlags.growthAutonomyExpansionV1 || growthAutonomyFlags.growthAutonomyExpansionPanelV1)
  ) {
    return NextResponse.json({ ok: false, message: "Expansion frozen or disabled." }, { status: 403 });
  }

  let body: {
    action?: string;
    freeze?: boolean;
    candidateId?: string;
    note?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const action = body.action;

  if (growthAutonomyFlags.growthAutonomyTrialV1 && hasAdjacentTrialExecutionInAudit()) {
    try {
      computeGrowthAutonomyTrialOutcomeSummary();
    } catch {
      /* noop */
    }
  }
  const expansionTrialLock = evaluateAdjacentTrialExpansionGovernanceLock({
    trialFeatureOn: growthAutonomyFlags.growthAutonomyTrialV1,
    trialEverExecuted: hasAdjacentTrialExecutionInAudit(),
    trialOutcomeMeasured: getGrowthAutonomyTrialOutcomeSummary() !== null,
  });

  if (action === "approve_trial" && expansionTrialLock.blocksExpansionApprovals) {
    return NextResponse.json({ ok: false, message: expansionTrialLock.reason }, { status: 403 });
  }

  if (action === "set_freeze") {
    const cur = await getGrowthAutonomyExpansionState();
    await saveGrowthAutonomyExpansionState({
      freeze: !!body.freeze,
      pending: cur.pending,
      activatedTrials: cur.activatedTrials,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_trial") {
    const cid = typeof body.candidateId === "string" ? body.candidateId : "";
    const cand = getExpansionCandidateById(cid);
    if (!cand) {
      return NextResponse.json({ ok: false, message: "Unknown candidate." }, { status: 400 });
    }

    const cur = await getGrowthAutonomyExpansionState();
    if (growthAutonomyFlags.growthAutonomyExpansionFreeze || cur.freeze) {
      return NextResponse.json({ ok: false, message: "Expansion freeze active." }, { status: 403 });
    }

    const dup = cur.activatedTrials.some((t) => t.candidateId === cand.id);
    const nextTrials =
      dup ?
        cur.activatedTrials
      : [
          ...cur.activatedTrials,
          {
            candidateId: cand.id,
            proposedActionKey: cand.proposedActionKey as string,
            approvedAt: new Date().toISOString(),
            approvedByUserId: auth.userId,
            note: typeof body.note === "string" ? body.note : undefined,
          },
        ];

    await saveGrowthAutonomyExpansionState({
      freeze: cur.freeze,
      pending: cur.pending,
      activatedTrials: nextTrials,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
}
