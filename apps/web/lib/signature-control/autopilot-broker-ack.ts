/** Mandatory broker review line before autopilot / action-pipeline execution is recorded. */
export const AUTOPILOT_ACTION_PIPELINE_ACK_TEXT =
  "I confirm that I have reviewed and approve this action as a licensed real estate broker.";

export const SIGNATURE_CONTROL_NAMESPACE = "signature-control";

export const SIGNATURE_CONTROL_EVENTS = {
  actionCreated: `${SIGNATURE_CONTROL_NAMESPACE}.action_created`,
  readyForSignature: `${SIGNATURE_CONTROL_NAMESPACE}.ready_for_signature`,
  signed: `${SIGNATURE_CONTROL_NAMESPACE}.signed`,
  executed: `${SIGNATURE_CONTROL_NAMESPACE}.executed`,
} as const;
