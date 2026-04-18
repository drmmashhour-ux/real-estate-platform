import { NextResponse } from "next/server";
import { growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import type {
  GrowthPolicyEnforcementDisabledResponse,
  GrowthPolicyEnforcementEnabledResponse,
} from "@/modules/growth/growth-policy-enforcement-api.types";
import { policyEnforcementApiRequestHasDebug } from "@/modules/growth/growth-policy-enforcement-debug";
import { getGrowthPolicyEnforcementMonitoringSnapshot } from "@/modules/growth/growth-policy-enforcement-monitoring.service";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";

export const dynamic = "force-dynamic";

/**
 * Read-only enforcement snapshot for advisory gating.
 * When the layer flag is off, returns 200 with a structured disabled payload (not 403) so clients can show operator copy.
 */
export async function GET(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const panelFlag = growthPolicyEnforcementFlags.growthPolicyEnforcementPanelV1;

  if (!growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    const body: GrowthPolicyEnforcementDisabledResponse = {
      enforcementLayerEnabled: false,
      enforcementPanelFlagEnabled: panelFlag,
      advisoryScopeOnly: true,
      snapshot: null,
      operatorMessage:
        "Growth Policy Enforcement is disabled (FEATURE_GROWTH_POLICY_ENFORCEMENT_V1). No advisory snapshot is emitted; UI should not infer stronger gates than legacy behavior.",
    };
    return NextResponse.json(body);
  }

  const snapshot = await buildGrowthPolicyEnforcementSnapshot();
  if (!snapshot) {
    const body: GrowthPolicyEnforcementDisabledResponse = {
      enforcementLayerEnabled: false,
      enforcementPanelFlagEnabled: panelFlag,
      advisoryScopeOnly: true,
      snapshot: null,
      operatorMessage:
        "Growth Policy Enforcement snapshot could not be built — verify flags and upstream governance modules.",
    };
    return NextResponse.json(body);
  }

  const withDebug = policyEnforcementApiRequestHasDebug(req);
  const body: GrowthPolicyEnforcementEnabledResponse = {
    enforcementLayerEnabled: true,
    enforcementPanelFlagEnabled: panelFlag,
    advisoryScopeOnly: true,
    snapshot,
  };

  if (withDebug) {
    body.operationalMonitoring = getGrowthPolicyEnforcementMonitoringSnapshot();
    body.debug = {
      snapshotAvailable: true,
      notesCount: snapshot.notes.length,
      warningsCount: snapshot.missingDataWarnings.length,
    };
  }

  return NextResponse.json(body);
}
