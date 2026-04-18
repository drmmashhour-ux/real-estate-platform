export type BrokerPushCategory =
  | "urgent_deadline"
  | "document_received"
  | "signature_completed"
  | "client_reply"
  | "negotiation_action"
  | "payment_status"
  | "closing_risk"
  | "compliance"
  | "high_priority_lead";

export type BrokerPushPreferences = {
  categories: Partial<Record<BrokerPushCategory, boolean>>;
  privacyMinimizeLockScreen: boolean;
};
