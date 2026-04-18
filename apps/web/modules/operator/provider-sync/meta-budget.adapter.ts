import { operatorV2Flags, isOperatorExternalBudgetWriteEnabled } from "@/config/feature-flags";
import type { BudgetExecutionAction, BudgetSyncPayload, ExternalSyncResult, ExternalAdProvider } from "../operator-v2.types";
import type { AdProviderBudgetAdapter } from "./provider-adapter.types";

async function validateMetaMapping(payload: BudgetSyncPayload) {
  if (!payload.externalCampaignId?.trim()) {
    return { valid: false as const, reason: "Missing external Meta campaign id — link campaign in Operator provider mapping." };
  }
  return { valid: true as const };
}

function metaCredentialsPresent(): boolean {
  return !!(
    process.env.META_ADS_ACCESS_TOKEN?.trim() ||
    process.env.FACEBOOK_ADS_ACCESS_TOKEN?.trim() ||
    process.env.META_MARKETING_API_ACCESS_TOKEN?.trim()
  );
}

function baseResult(
  partial: Omit<ExternalSyncResult, "createdAt"> & { action: BudgetExecutionAction },
): ExternalSyncResult {
  return {
    ...partial,
    createdAt: new Date().toISOString(),
  };
}

export function createMetaBudgetAdapter(): AdProviderBudgetAdapter {
  const provider: ExternalAdProvider = "META";

  return {
    provider,

    validateCampaignMapping: validateMetaMapping,

    async simulateBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult> {
      const action = payload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_INCREASE";
      const v = await validateMetaMapping(payload);
      if (!v.valid) {
        return baseResult({
          success: false,
          provider,
          action,
          externalCampaignId: payload.externalCampaignId,
          targetId: payload.campaignId,
          dryRun: true,
          message: v.reason ?? "Invalid mapping",
          warnings: ["Dry-run only — no outbound call."],
          providerResponse: null,
        });
      }
      return baseResult({
        success: true,
        provider,
        action,
        externalCampaignId: payload.externalCampaignId,
        targetId: payload.campaignId,
        dryRun: true,
        message:
          "Simulation only — Meta Marketing API not invoked. Enable FEATURE_OPERATOR_EXTERNAL_SYNC_V1 + credentials for live writes.",
        warnings: ["No provider mutation in simulation."],
        providerResponse: { simulated: true, proposedBudget: payload.proposedBudget },
      });
    },

    async syncBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult> {
      const action = payload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_INCREASE";
      const v = await validateMetaMapping(payload);
      if (!v.valid) {
        return baseResult({
          success: false,
          provider,
          action,
          dryRun: false,
          message: v.reason ?? "Invalid mapping",
          providerResponse: null,
        });
      }

      if (!operatorV2Flags.operatorV2BudgetSyncV1 || !isOperatorExternalBudgetWriteEnabled("META")) {
        return baseResult({
          success: false,
          provider,
          action,
          dryRun: false,
          message:
            "External Meta sync disabled by feature flags — no API call made. Enable FEATURE_OPERATOR_V2_BUDGET_SYNC_V1, FEATURE_OPERATOR_EXTERNAL_SYNC_V1, and FEATURE_OPERATOR_PROVIDER_META_V1 after credential validation.",
          warnings: ["Not configured for live writes."],
          providerResponse: null,
        });
      }

      if (!metaCredentialsPresent()) {
        return baseResult({
          success: false,
          provider,
          action: "SYNC_CAMPAIGN_BUDGET_INCREASE",
          dryRun: false,
          message:
            "Meta credentials not configured (set META_ADS_ACCESS_TOKEN or FACEBOOK_ADS_ACCESS_TOKEN in a secure env). No API call made.",
          providerResponse: { notConfigured: true },
        });
      }

      return baseResult({
        success: false,
        provider,
        action,
        dryRun: false,
        message:
          "Meta live budget write is not wired to Marketing API in this build — refusing to fabricate success. Implement API client and re-test in staging.",
        warnings: ["SDK/API integration placeholder — operator must verify in Meta Ads Manager until wired."],
        providerResponse: { deferred: true, wouldSetBudget: payload.proposedBudget },
      });
    },
  };
}
