import { BasePendingExternalConnector } from "./baseExternalConnector";

export class GoogleAdsConnector extends BasePendingExternalConnector {
  readonly code = "google_ads";
  protected displayName = "Google Ads API";
  readonly requiredEnvKeys = ["GOOGLE_LEAD_WEBHOOK_TOKEN"] as const;
}
