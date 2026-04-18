import type { BudgetSyncPayload, ExternalSyncResult } from "../operator-v2.types";

export interface AdProviderBudgetAdapter {
  provider: "META" | "GOOGLE" | "UNKNOWN";
  validateCampaignMapping(payload: BudgetSyncPayload): Promise<{ valid: boolean; reason?: string }>;
  simulateBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult>;
  syncBudgetChange(payload: BudgetSyncPayload): Promise<ExternalSyncResult>;
}
