/**
 * Rollback support for Operator V2 — restores a prior budget from sync log metadata (no arbitrary state).
 * Adapters use the same credential/flag rules as forward sync; may return honest "not wired" results.
 */
import { operatorV2Flags } from "@/config/feature-flags";
import * as syncRepo from "./operator-external-sync.repository";
import type { BudgetExecutionAction, BudgetSyncPayload, ExternalSyncResult } from "./operator-v2.types";
import { getBudgetAdapter } from "./provider-sync/provider-adapter.registry";

type StoredRequest = {
  payload?: BudgetSyncPayload;
  previousBudget?: number;
};

function parseStoredRequest(log: { requestPayload: unknown }): StoredRequest | null {
  if (!log.requestPayload || typeof log.requestPayload !== "object") return null;
  return log.requestPayload as StoredRequest;
}

/**
 * Builds a reverse payload (proposedBudget = prior budget before the sync) for adapter calls.
 */
export async function buildBudgetRollbackPayload(syncLogId: string): Promise<
  | { ok: true; payload: BudgetSyncPayload; executionAction: BudgetExecutionAction; manualInstructions: string }
  | { ok: false; message: string }
> {
  if (!operatorV2Flags.operatorV2BudgetSyncV1) {
    return { ok: false, message: "Operator V2 budget sync is disabled." };
  }
  const log = await syncRepo.getExternalSyncLogById(syncLogId);
  if (!log) return { ok: false, message: "Sync log not found." };
  if (!log.success) return { ok: false, message: "Only successful syncs carry rollback metadata." };
  if (log.dryRun) return { ok: false, message: "Dry-run logs cannot be rolled back via API — use manual instructions only." };

  const stored = parseStoredRequest(log);
  const orig = stored?.payload;
  const previousBudget = stored?.previousBudget;
  if (!orig || typeof previousBudget !== "number") {
    return {
      ok: false,
      message: "Log is missing previous budget snapshot — cannot build rollback payload.",
    };
  }

  const campaignId = orig.campaignId;
  const link = await syncRepo.getCampaignProviderLink(campaignId, orig.provider);
  if (!link) {
    return { ok: false, message: "Provider mapping no longer exists for this campaign." };
  }

  const rollbackPayload: BudgetSyncPayload = {
    campaignId,
    provider: orig.provider,
    externalCampaignId: link.externalCampaignId,
    currentBudget: orig.proposedBudget,
    proposedBudget: previousBudget,
    currency: orig.currency,
    reason: `Rollback of sync log ${syncLogId} to prior budget.`,
    sourceRecommendationId: log.recommendationId,
    executionAction:
      previousBudget < orig.proposedBudget ? "SYNC_CAMPAIGN_BUDGET_DECREASE" : "SYNC_CAMPAIGN_BUDGET_INCREASE",
  };

  const manualInstructions = [
    `In ${orig.provider} Ads: open campaign ${link.externalCampaignId}.`,
    `Set daily/lifetime budget to ${previousBudget} ${orig.currency} (restore prior level).`,
    `Reference Operator sync log id ${syncLogId} for audit.`,
  ].join(" ");

  return {
    ok: true,
    payload: rollbackPayload,
    executionAction: rollbackPayload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_DECREASE",
    manualInstructions,
  };
}

export async function simulateRollback(syncLogId: string): Promise<ExternalSyncResult | { error: string }> {
  const built = await buildBudgetRollbackPayload(syncLogId);
  if (!built.ok) return { error: built.message };
  const adapter = getBudgetAdapter(built.payload.provider);
  return adapter.simulateBudgetChange({
    ...built.payload,
    executionAction: built.executionAction,
  });
}

export async function rollbackBudgetChange(syncLogId: string): Promise<ExternalSyncResult | { error: string }> {
  const built = await buildBudgetRollbackPayload(syncLogId);
  if (!built.ok) return { error: built.message };
  const adapter = getBudgetAdapter(built.payload.provider);
  const exec = await adapter.syncBudgetChange({
    ...built.payload,
    executionAction: built.executionAction,
  });
  await syncRepo.logExternalSync({
    recommendationId: built.payload.sourceRecommendationId ?? null,
    actionType: `ROLLBACK:${built.executionAction}`,
    provider: built.payload.provider,
    targetId: built.payload.campaignId,
    externalTargetId: built.payload.externalCampaignId ?? null,
    dryRun: false,
    success: exec.success,
    message: exec.message,
    requestPayload: { rollbackOfSyncLogId: syncLogId, payload: built.payload },
    responsePayload: { execution: exec },
    warnings: exec.warnings,
  });
  return exec;
}
