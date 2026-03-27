import { BasePendingExternalConnector } from "./baseExternalConnector";

export class WhatsAppBusinessConnector extends BasePendingExternalConnector {
  readonly code = "whatsapp_business";
  protected displayName = "WhatsApp Business (templates required)";
  readonly requiredEnvKeys = ["WHATSAPP_BUSINESS_TOKEN"] as const;
}
