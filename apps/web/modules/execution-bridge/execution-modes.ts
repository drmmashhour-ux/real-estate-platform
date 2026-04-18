/**
 * How the broker moves mapped data toward official execution — never implies OACIQ replacement.
 */
export type BrokerExecutionMode = "draft_only" | "broker_manual_export" | "provider_connected" | "assisted_execution";

export function detectExecutionMode(input: {
  oaciqBridgeEnabled: boolean;
  externalProviderConfigured: boolean;
  brokerAssistedWorkflow: boolean;
}): BrokerExecutionMode {
  if (input.brokerAssistedWorkflow) return "assisted_execution";
  if (input.externalProviderConfigured) return "provider_connected";
  if (input.oaciqBridgeEnabled) return "broker_manual_export";
  return "draft_only";
}
