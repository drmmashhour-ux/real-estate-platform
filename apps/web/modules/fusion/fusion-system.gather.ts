/**
 * Read-only gather of subsystem outputs for Fusion V1. Never mutates sources.
 */
import { platformCoreFlags } from "@/config/feature-flags";
import { getAdsAutopilotV8MonitoringSnapshot } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.monitoring";
import { getBrainV8ShadowMonitoringSnapshot } from "@/modules/platform-core/brain-v8-shadow-monitoring.service";
import type { BrainSnapshotPayload } from "@/modules/platform-core/brain-snapshot.service";
import type { CoreDecisionRecord } from "@/modules/platform-core/platform-core.types";
import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import type { AdsAutopilotV8MonitoringSnapshot } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.monitoring";
import type { BrainV8ShadowMonitoringSnapshot } from "@/modules/platform-core/brain-v8-shadow-monitoring.service";

export type FusionRawGather = {
  brainV8Monitoring: BrainV8ShadowMonitoringSnapshot | null;
  brainSnapshot: BrainSnapshotPayload | null;
  adsMonitoring: AdsAutopilotV8MonitoringSnapshot | null;
  operatorRecommendations: AssistantRecommendation[] | null;
  platformDecisions: CoreDecisionRecord[] | null;
  gatherWarnings: string[];
};

export async function gatherFusionRawInputs(): Promise<FusionRawGather> {
  const gatherWarnings: string[] = [];

  const brainV8Monitoring = getBrainV8ShadowMonitoringSnapshot();

  let brainSnapshot: BrainSnapshotPayload | null = null;
  try {
    const { buildBrainSnapshot } = await import("@/modules/platform-core/brain-snapshot.service");
    brainSnapshot = await buildBrainSnapshot();
  } catch (e) {
    gatherWarnings.push(`brain_snapshot: ${e instanceof Error ? e.message : String(e)}`);
    brainSnapshot = null;
  }

  const adsMonitoring: AdsAutopilotV8MonitoringSnapshot = getAdsAutopilotV8MonitoringSnapshot();

  let operatorRecommendations: AssistantRecommendation[] | null = null;
  try {
    const { listRecommendations } = await import("@/modules/operator/operator.repository");
    operatorRecommendations = await listRecommendations(40);
  } catch (e) {
    gatherWarnings.push(`operator: ${e instanceof Error ? e.message : String(e)}`);
    operatorRecommendations = null;
  }

  let platformDecisions: CoreDecisionRecord[] | null = null;
  if (platformCoreFlags.platformCoreV1) {
    try {
      const { listDecisions } = await import("@/modules/platform-core/platform-core.repository");
      platformDecisions = await listDecisions({ limit: 50 });
    } catch (e) {
      gatherWarnings.push(`platform_core: ${e instanceof Error ? e.message : String(e)}`);
      platformDecisions = null;
    }
  } else {
    platformDecisions = null;
  }

  return {
    brainV8Monitoring,
    brainSnapshot,
    adsMonitoring,
    operatorRecommendations,
    platformDecisions,
    gatherWarnings,
  };
}

/** Test seam — bypasses heavy imports when needed. */
export function mergeFusionGatherForTests(partial: Partial<FusionRawGather>): FusionRawGather {
  return {
    brainV8Monitoring: partial.brainV8Monitoring ?? getBrainV8ShadowMonitoringSnapshot(),
    brainSnapshot: partial.brainSnapshot ?? null,
    adsMonitoring: partial.adsMonitoring ?? getAdsAutopilotV8MonitoringSnapshot(),
    operatorRecommendations: partial.operatorRecommendations ?? null,
    platformDecisions: partial.platformDecisions ?? null,
    gatherWarnings: partial.gatherWarnings ?? [],
  };
}
