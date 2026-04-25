/** Use with `logAuditEvent` / analytics — immutable compliance chronology. */
export const OACIQ_VIA_AUDIT_ACTIONS = {
  dataVerified: "oaciq_via_data_verified",
  sourcesRecorded: "oaciq_via_sources_used",
  adviceGenerated: "oaciq_via_advice_generated",
  brokerApproval: "oaciq_via_broker_approval",
  adviceBlocked: "oaciq_via_advice_blocked",
  inspectionReminderLogged: "oaciq_via_inspection_reminder",
  pricingAdviceBlocked: "oaciq_via_pricing_blocked",
} as const;
