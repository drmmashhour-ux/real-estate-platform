/** `ComplianceAuditRecord.actionType` + `ComplaintEvent.eventType` alignment for complaint governance. */

export const COMPLAINT_AUDIT_ACTION_TYPES = [
  "complaint_created",
  "complaint_acknowledged",
  "complaint_classified",
  "complaint_assigned",
  "complaint_evidence_attached",
  "complaint_escalation_suggested",
  "complaint_public_assistance_suggested",
  "complaint_syndic_suggested",
  "complaint_capa_created",
  "complaint_resolved",
  "complaint_closed",
  "consumer_protections_explained",
] as const;

export type ComplaintAuditActionType = (typeof COMPLAINT_AUDIT_ACTION_TYPES)[number];
