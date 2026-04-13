/**
 * Broker-configurable policy hooks — v1: conservative defaults (manual approval for autopilot).
 */

export type RequestPolicy = {
  autopilotCreatesDraftOnly: boolean;
  requireBrokerApprovalForAutopilot: boolean;
  allowBundledOutreach: boolean;
};

export function defaultRequestPolicy(): RequestPolicy {
  return {
    autopilotCreatesDraftOnly: true,
    requireBrokerApprovalForAutopilot: true,
    allowBundledOutreach: true,
  };
}
