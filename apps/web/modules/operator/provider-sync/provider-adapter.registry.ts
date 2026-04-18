import type { BudgetSyncPayload, ExternalAdProvider, ExternalSyncResult } from "../operator-v2.types";
import type { AdProviderBudgetAdapter } from "./provider-adapter.types";
import { createGoogleBudgetAdapter } from "./google-budget.adapter";
import { createMetaBudgetAdapter } from "./meta-budget.adapter";

function createUnknownBudgetAdapter(): AdProviderBudgetAdapter {
  const provider: ExternalAdProvider = "UNKNOWN";
  const fail = (payload: BudgetSyncPayload, dryRun: boolean): ExternalSyncResult => ({
    success: false,
    provider,
    action: payload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_INCREASE",
    targetId: payload.campaignId,
    dryRun,
    message: "Provider UNKNOWN — use a Meta or Google provider mapping; no outbound call.",
    createdAt: new Date().toISOString(),
  });
  return {
    provider,
    validateCampaignMapping: async () => ({ valid: false, reason: "Provider must be META or GOOGLE." }),
    simulateBudgetChange: async (payload) => fail(payload, true),
    syncBudgetChange: async (payload) => fail(payload, false),
  };
}

export function getBudgetAdapter(provider: ExternalAdProvider): AdProviderBudgetAdapter {
  switch (provider) {
    case "META":
      return createMetaBudgetAdapter();
    case "GOOGLE":
      return createGoogleBudgetAdapter();
    default:
      return createUnknownBudgetAdapter();
  }
}
