import { BasePendingExternalConnector } from "./baseExternalConnector";

export class MetaAdsConnector extends BasePendingExternalConnector {
  readonly code = "meta_ads";
  protected displayName = "Meta Marketing API";
  readonly requiredEnvKeys = ["META_APP_SECRET"] as const;
}
