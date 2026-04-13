/**
 * Env defaults + optional DB overrides via `featureFlag` (see `isFeatureEnabled`).
 */
import { isFeatureEnabled } from "@/lib/operational-controls";

export const COORDINATION_FLAG_KEYS = {
  documentRequestAutopilotV1: "document_request_autopilot_v1",
  bankCoordinationV1: "bank_coordination_v1",
  notaryCoordinationHubV1: "notary_coordination_hub_v1",
  requestCommunicationsV1: "request_communications_v1",
  closingRequestValidationV1: "closing_request_validation_v1",
} as const;

function envOn(name: string): boolean {
  return process.env[name] === "true" || process.env[name] === "1";
}

export async function coordinationFlags() {
  const [
    documentRequestAutopilotV1,
    bankCoordinationV1,
    notaryCoordinationHubV1,
    requestCommunicationsV1,
    closingRequestValidationV1,
    liveOutboundEmail,
  ] = await Promise.all([
    isFeatureEnabled(COORDINATION_FLAG_KEYS.documentRequestAutopilotV1).then(
      (db) => db || envOn("FEATURE_DOCUMENT_REQUEST_AUTOPILOT_V1")
    ),
    isFeatureEnabled(COORDINATION_FLAG_KEYS.bankCoordinationV1).then((db) => db || envOn("FEATURE_BANK_COORDINATION_V1")),
    isFeatureEnabled(COORDINATION_FLAG_KEYS.notaryCoordinationHubV1).then(
      (db) => db || envOn("FEATURE_NOTARY_COORDINATION_HUB_V1")
    ),
    isFeatureEnabled(COORDINATION_FLAG_KEYS.requestCommunicationsV1).then(
      (db) => db || envOn("FEATURE_REQUEST_COMMUNICATIONS_V1")
    ),
    isFeatureEnabled(COORDINATION_FLAG_KEYS.closingRequestValidationV1).then(
      (db) => db || envOn("FEATURE_CLOSING_REQUEST_VALIDATION_V1")
    ),
    Promise.resolve(envOn("FEATURE_COORDINATION_LIVE_EMAIL")),
  ]);

  return {
    documentRequestAutopilotV1,
    bankCoordinationV1,
    notaryCoordinationHubV1,
    requestCommunicationsV1,
    closingRequestValidationV1,
    /** Live email send — default off; drafts/logs always allowed when comms v1 on. */
    liveOutboundEmail,
  };
}
