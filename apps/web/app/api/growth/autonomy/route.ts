import { NextResponse } from "next/server";
import { growthAutonomyFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { computeLowRiskAutoViewerGate } from "@/modules/growth/growth-autonomy-auto-gate";
import { parseGrowthAutonomyAutoLowRiskRolloutFromEnv } from "@/modules/growth/growth-autonomy-auto-config";
import { growthAutonomyApiRequestHasDebug } from "@/modules/growth/growth-autonomy-debug";
import { parseGrowthAutonomyRolloutFromEnv } from "@/modules/growth/growth-autonomy-config";
import {
  getGrowthAutonomyMonitoringSnapshot,
  recordGrowthAutonomyApiRead,
} from "@/modules/growth/growth-autonomy-monitoring.service";
import { buildGrowthAutonomySnapshot } from "@/modules/growth/growth-autonomy.service";
import { viewerReceivesGrowthAutonomySnapshotInternal } from "@/modules/growth/growth-autonomy-internal-access";

export const dynamic = "force-dynamic";

function rolloutStatusPayload(args: {
  rolloutStage: ReturnType<typeof parseGrowthAutonomyRolloutFromEnv>;
  internalGateBlocked: boolean;
  snapshotDelivered: boolean;
  viewerPilotEligible: boolean;
}) {
  const enforcementAvailable = growthPolicyEnforcementFlags.growthPolicyEnforcementV1;
  return {
    rolloutMode: args.rolloutStage,
    autonomyEnabled: growthAutonomyFlags.growthAutonomyV1,
    panelEnabled: growthAutonomyFlags.growthAutonomyPanelV1,
    killSwitchEnabled: growthAutonomyFlags.growthAutonomyKillSwitch,
    enforcementAvailable,
    internalGateBlocked: args.internalGateBlocked,
    snapshotDelivered: args.snapshotDelivered,
    viewerInternalPilotEligible: args.viewerPilotEligible,
    partialExposureNote:
      args.rolloutStage === "partial"
        ? "Partial rollout: only the configured cohort should see autonomy surfaces (server-side selection — confirm with ops if missing)."
        : null,
  };
}

export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  recordGrowthAutonomyApiRead();

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "en";
  const country = url.searchParams.get("country") ?? "ca";
  const growthDashboardPath = `/${locale}/${country}/dashboard/growth`;

  const debugReq = growthAutonomyApiRequestHasDebug(req);
  const surfaceDebug =
    debugReq ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_GROWTH_AUTONOMY_DEBUG === "1";

  const rolloutStage = parseGrowthAutonomyRolloutFromEnv();

  const viewerPilotEligible = viewerReceivesGrowthAutonomySnapshotInternal({
    role: auth.role,
    userId: auth.userId,
    debugRequest: debugReq,
  });

  const internalGateBlocked =
    rolloutStage === "internal" && process.env.NODE_ENV === "production" && !viewerPilotEligible;

  const rsBase = {
    rolloutStage,
    rolloutStatus: rolloutStatusPayload({
      rolloutStage,
      internalGateBlocked,
      snapshotDelivered: false,
      viewerPilotEligible,
    }),
  };

  if (growthAutonomyFlags.growthAutonomyKillSwitch) {
    return NextResponse.json({
      autonomyLayerEnabled: false,
      killSwitchActive: true,
      operatorMessage:
        "Growth autonomy kill switch is active (FEATURE_GROWTH_AUTONOMY_KILL_SWITCH). No autonomy snapshot is returned.",
      snapshot: null,
      ...rsBase,
    });
  }

  if (!growthAutonomyFlags.growthAutonomyV1) {
    return NextResponse.json({
      autonomyLayerEnabled: false,
      killSwitchActive: false,
      operatorMessage:
        "Growth autonomy is disabled (FEATURE_GROWTH_AUTONOMY_V1). Operators see no autonomy suggestions until enabled.",
      snapshot: null,
      ...rsBase,
    });
  }

  if (internalGateBlocked) {
    const withMon = debugReq ? { operationalMonitoring: getGrowthAutonomyMonitoringSnapshot() } : {};
    return NextResponse.json({
      autonomyLayerEnabled: true,
      internalGateBlocked: true,
      operatorMessage:
        "Internal rollout: snapshot is limited to admins, internal-operator allowlist (GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS), NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI=1, non-production, or ?growthAutonomyDebug=1.",
      snapshot: null,
      ...withMon,
      ...rsBase,
    });
  }

  const autoRolloutStage = parseGrowthAutonomyAutoLowRiskRolloutFromEnv();
  const gate = computeLowRiskAutoViewerGate({
    autoRolloutStage,
    autonomyRolloutStage: rolloutStage,
    userId: auth.userId,
    role: auth.role,
    debugRequest: debugReq,
  });

  const snapshot = await buildGrowthAutonomySnapshot({
    growthDashboardPath,
    surfaceDebug,
    autoLowRiskContext: {
      cohortBucket: gate.cohortBucket,
      viewerMayReceiveAutoExecution: gate.mayReceiveAutoExecution,
      autoRolloutStage,
    },
  });

  const withMon =
    debugReq || process.env.NODE_ENV !== "production"
      ? { operationalMonitoring: getGrowthAutonomyMonitoringSnapshot() }
      : {};

  return NextResponse.json({
    autonomyLayerEnabled: snapshot.autonomyLayerEnabled,
    internalGateBlocked: false,
    snapshot,
    ...withMon,
    rolloutStage,
    rolloutStatus: rolloutStatusPayload({
      rolloutStage,
      internalGateBlocked: false,
      snapshotDelivered: true,
      viewerPilotEligible,
    }),
  });
}
