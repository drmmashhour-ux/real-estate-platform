import { logTurboDraftEvent } from "../turbo-form-drafting/auditLogger";

export async function logTrustHubEvent(args: {
  draftId: string;
  userId?: string;
  eventKey: "trust_score_calculated" | "trust_badge_granted" | "safer_choice_generated" | "clause_explained" | "protection_mode_enabled" | "broker_assist_requested";
  severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  payload?: any;
}) {
  return logTurboDraftEvent({
    draftId: args.draftId,
    userId: args.userId,
    eventKey: args.eventKey,
    severity: args.severity,
    payload: args.payload
  });
}
