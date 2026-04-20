/**
 * Structured console logs for Legal Hub analytics hooks — no PII; safe no-op on failure.
 */

export type LegalAnalyticsPayload = {
  actorType?: string;
  workflowType?: string;
  requirementId?: string;
  documentId?: string;
  riskId?: string;
  locale?: string;
  country?: string;
  listingId?: string;
  entityId?: string;
  countsSummary?: Record<string, number>;
  timestamp?: string;
};

function stamp(p: LegalAnalyticsPayload): LegalAnalyticsPayload {
  return { ...p, timestamp: new Date().toISOString() };
}

function emit(eventName: string, payload: LegalAnalyticsPayload): void {
  try {
    const safe = stamp(payload);
    if (typeof console !== "undefined" && typeof console.log === "function") {
      console.log(`[legal] ${eventName}`, JSON.stringify(safe));
    }
  } catch {
    /* no-op */
  }
}

export function trackLegalHubViewed(payload: LegalAnalyticsPayload): void {
  emit("legal_hub_viewed", payload);
}

export function trackLegalWorkflowViewed(payload: LegalAnalyticsPayload): void {
  emit("legal_workflow_viewed", payload);
}

export function trackLegalRequirementActionViewed(payload: LegalAnalyticsPayload): void {
  emit("legal_requirement_action_viewed", payload);
}

export function trackLegalDocumentViewed(payload: LegalAnalyticsPayload): void {
  emit("legal_document_viewed", payload);
}

export function trackLegalRiskViewed(payload: LegalAnalyticsPayload): void {
  emit("legal_risk_viewed", payload);
}
