/**
 * Full automation loop — admin recommendations only; FEATURE_AI_ADS_AUTOMATION_LOOP_V1 gates surfacing.
 *
 * V8 safe refactor: implementation lives in `ads-automation-loop.autopilot.adapter.helpers.ts` so this file stays a
 * stable entrypoint. Public export and async signature are unchanged for callers.
 */
import { adsAiAutomationFlags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import type { ProposedAction } from "../ai-autopilot.types";
import { buildProposedActionsAdsAutomationLoop } from "./ads-automation-loop.autopilot.adapter.helpers";
import {
  applyAdsV8InfluenceOverlay,
  buildAdsV8ShadowInsightsFromProposalSets,
} from "./ads-v8-influence-overlay.service";
import {
  buildShadowProposedActionsAdsAutomationLoop,
  scheduleAdsAutopilotShadowObservation,
  scheduleAdsAutopilotShadowObservationFromResults,
} from "./ads-automation-loop.autopilot.adapter.shadow";
import { recordAdsAutopilotAdapterRun } from "./ads-automation-loop.autopilot.adapter.monitoring";
import { buildAdsAutopilotProposalsWithV8Routing } from "./ads-automation-loop.autopilot.adapter.v8-primary-routing";

export async function proposalsAdsAutomationLoop(userId: string): Promise<ProposedAction[]> {
  const livePromise = buildProposedActionsAdsAutomationLoop();
  const rollout = adsAiAutomationFlags.adsAutopilotV8RolloutV1;
  const shadowOn = adsAiAutomationFlags.adsAutopilotShadowModeV1;
  const influenceOn = adsAiAutomationFlags.adsAutopilotV8InfluenceV1;
  const primaryOn = adsAiAutomationFlags.adsAutopilotV8PrimaryV1;

  if (!rollout) {
    recordAdsAutopilotAdapterRun("legacy");
    logInfo("[ads:autopilot:adapter]", {
      path: "legacy",
      note: "V8 rollout off — proposals only; no shadow observation hook",
      userId: userId || null,
    });
    return livePromise;
  }

  recordAdsAutopilotAdapterRun("v8_rollout");
  logInfo("[ads:autopilot:adapter]", {
    path: "v8_rollout",
    note: "V8 rollout; Phase D primary gated by FEATURE_ADS_AUTOPILOT_V8_PRIMARY_V1",
    userId: userId || null,
  });

  /** Phase D: V8 primary path — legacy remains for fallback; Phase C influence bypassed when primary ON. */
  if (rollout && primaryOn) {
    return buildAdsAutopilotProposalsWithV8Routing(userId);
  }

  if (rollout && shadowOn && influenceOn) {
    const [live, shadow] = await Promise.all([
      livePromise,
      buildShadowProposedActionsAdsAutomationLoop(),
    ]);
    const shadowInsights = buildAdsV8ShadowInsightsFromProposalSets(live, shadow);
    const overlay = applyAdsV8InfluenceOverlay({
      liveActions: live,
      shadowInsights,
      constraints: { maxAdjustedFraction: 0.28 },
    });
    if (overlay.metadata.skipped || !overlay.metadata.applied) {
      scheduleAdsAutopilotShadowObservationFromResults({ userId, live, shadow });
      return live;
    }
    scheduleAdsAutopilotShadowObservationFromResults({ userId, live, shadow });
    return overlay.influencedActions;
  }

  if (!shadowOn) {
    logWarn("[ads:autopilot:adapter]", "v8_rollout_shadow_mode_off", {
      userId: userId || null,
      note: "shadow observation skipped — enable FEATURE_ADS_AUTOPILOT_SHADOW_MODE_V1 for parallel shadow",
    });
  }

  scheduleAdsAutopilotShadowObservation({ userId, livePromise });

  return livePromise;
}
