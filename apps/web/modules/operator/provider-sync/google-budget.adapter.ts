import { operatorV2Flags, isOperatorExternalBudgetWriteEnabled } from "@/config/feature-flags";
import type { BudgetSyncPayload, ExternalSyncResult, ExternalAdProvider } from "../operator-v2.types";
import type { AdProviderBudgetAdapter } from "./provider-adapter.types";

async function validateGoogleMapping(payload: BudgetSyncPayload) {
  if (!payload.externalCampaignId?.trim()) {
    return {
      valid: false as const,
      reason: "Missing external Google Ads campaign resource name — link campaign in Operator provider mapping.",
    };
  }
  return { valid: true as const };
}

function googleCredentialsPresent(): boolean {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() &&
    process.env.GOOGLE_ADS_CUSTOMER_ID?.trim()
  );
}

function baseResult(
  partial: Omit<ExternalSyncResult, "createdAt">,
): ExternalSyncResult {
  return { ...partial, createdAt: new Date().toISOString() };
}

export function createGoogleBudgetAdapter(): AdProviderBudgetAdapter {
  const provider: ExternalAdProvider = "GOOGLE";

  return {
    provider,

    async validateCampaignMapping(payload: BudgetSyncPayload) {
      if (!payload.externalCampaignId?.trim()) {
        return {
          valid: false,
          reason: "Missing external Google Ads campaign resource name — link campaign in Operator provider mapping.",
        };
      }
      return { valid: true };
    },

    async simulateBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult> {
      const action = payload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_INCREASE";
      const v = await validateGoogleMapping(payload);
      if (!v.valid) {
        return baseResult({
          success: false,
          provider,
          action,
          externalCampaignId: payload.externalCampaignId,
          targetId: payload.campaignId,
          dryRun: true,
          message: v.reason ?? "Invalid mapping",
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
          "Simulation only — Google Ads API not invoked. Enable FEATURE_OPERATOR_EXTERNAL_SYNC_V1 + credentials for live writes.",
        warnings: ["No provider mutation in simulation."],
        providerResponse: { simulated: true, proposedBudget: payload.proposedBudget },
      });
    },

    async syncBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult> {
      const action = payload.executionAction ?? "SYNC_CAMPAIGN_BUDGET_INCREASE";
      const v = await validateGoogleMapping(payload);
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

      if (!operatorV2Flags.operatorV2BudgetSyncV1 || !isOperatorExternalBudgetWriteEnabled("GOOGLE")) {
        return baseResult({
          success: false,
          provider,
          action,
          dryRun: false,
          message:
            "External Google sync disabled by feature flags — no API call made. Enable operator V2 + external sync + provider Google after credential validation.",
          warnings: ["Not configured for live writes."],
          providerResponse: null,
        });
      }

      if (!googleCredentialsPresent()) {
        return baseResult({
          success: false,
          provider,
          action,
          dryRun: false,
          message:
            "Google Ads credentials incomplete (GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID). No API call made.",
          providerResponse: { notConfigured: true },
        });
      }

      return baseResult({
        success: false,
        provider,
        action,
        dryRun: false,
        message:
          "Google Ads live budget write is not wired in this build — refusing to fabricate success. Implement API client and re-test in staging.",
        warnings: ["SDK/API integration placeholder — verify in Google Ads UI until wired."],
        providerResponse: { deferred: true, wouldSetBudget: payload.proposedBudget },
      });
    },
  };
}
