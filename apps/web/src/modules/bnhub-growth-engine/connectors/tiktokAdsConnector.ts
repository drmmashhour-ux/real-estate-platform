import { BasePendingExternalConnector } from "./baseExternalConnector";

export class TikTokAdsConnector extends BasePendingExternalConnector {
  readonly code = "tiktok_ads";
  protected displayName = "TikTok for Business API";
  readonly requiredEnvKeys = ["TIKTOK_WEBHOOK_SECRET"] as const;
}
