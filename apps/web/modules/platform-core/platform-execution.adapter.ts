/**
 * Internal Platform Core execution — approval and One Brain trust gates remain mandatory.
 * One Brain V2 adaptive weights may adjust stored executionPriority metadata but never bypass APPROVED status or Operator external-sync guardrails.
 */
import { operatorV2Flags } from "@/config/feature-flags";
import type { CoreDecisionRecord } from "./platform-core.types";

export type PlatformExecutionResult =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Internal-only execution: metadata and audit-friendly results — no Stripe, ads APIs, or booking writes.
 */
export async function runPlatformExecution(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  switch (d.actionType) {
    case "SCALE_CAMPAIGN":
      return handleMarkCampaignReadyToScale(d);
    case "PAUSE_CAMPAIGN":
      return handleMarkCampaignReadyToPause(d);
    case "UPDATE_CTA_PRIORITY":
      return handlePrioritizeCtaVariant(d);
    case "UPDATE_RETARGETING_MESSAGE_PRIORITY":
      return handlePrioritizeRetargetingMessage(d);
    case "PROMOTE_EXPERIMENT_WINNER":
      return handlePromoteExperimentWinnerSafe(d);
    case "QUALITY_IMPROVEMENT":
      return handleFlagListingForImprovement(d);
    case "BOOST_LISTING":
      return handleBoostListingInternalScore(d);
    case "DOWNRANK_LISTING":
      return handleDownrankListingInternalScore(d);
    default:
      return {
        ok: true,
        result: {
          mode: "no_internal_side_effect",
          actionType: d.actionType,
          entityId: d.entityId,
        },
      };
  }
}

export async function handleMarkCampaignReadyToScale(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "mark_campaign_ready_to_scale",
      campaignId: d.entityId,
      recordedAt: new Date().toISOString(),
      externalBudgetSyncNote:
        operatorV2Flags.operatorV2BudgetSyncV1 ?
          "Meta/Google budget changes are not performed here — use Operator V2 admin simulate/execute after approval."
        : "Operator V2 budget sync disabled.",
    },
  };
}

export async function handleMarkCampaignReadyToPause(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "mark_campaign_ready_to_pause",
      campaignId: d.entityId,
      recordedAt: new Date().toISOString(),
      externalBudgetSyncNote:
        operatorV2Flags.operatorV2BudgetSyncV1 ?
          "Pause-prep / budget decrease toward external ads is not performed here — use Operator V2 admin simulate/execute after approval."
        : "Operator V2 budget sync disabled.",
    },
  };
}

export async function handlePrioritizeCtaVariant(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "prioritize_cta_variant",
      surfaceId: d.entityId,
      recordedAt: new Date().toISOString(),
    },
  };
}

export async function handlePrioritizeRetargetingMessage(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "prioritize_retargeting_message",
      messageKey: d.entityId,
      recordedAt: new Date().toISOString(),
    },
  };
}

export async function handlePromoteExperimentWinnerSafe(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "promote_experiment_winner_safe",
      experimentId: d.entityId,
      recordedAt: new Date().toISOString(),
    },
  };
}

export async function handleFlagListingForImprovement(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "flag_listing_improvement",
      listingId: d.entityId,
      recordedAt: new Date().toISOString(),
    },
  };
}

export async function handleBoostListingInternalScore(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "boost_listing_internal_score",
      listingId: d.entityId,
      note: "Intent recorded only — ranking weights are not mutated in this adapter.",
      recordedAt: new Date().toISOString(),
    },
  };
}

export async function handleDownrankListingInternalScore(d: CoreDecisionRecord): Promise<PlatformExecutionResult> {
  return {
    ok: true,
    result: {
      handler: "downrank_listing_internal_score",
      listingId: d.entityId,
      note: "Intent recorded only — ranking weights are not mutated in this adapter.",
      recordedAt: new Date().toISOString(),
    },
  };
}
