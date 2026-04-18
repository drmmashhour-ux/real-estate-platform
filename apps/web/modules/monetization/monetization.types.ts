export type RevenueStreamId =
  | "bnhub_booking_fee"
  | "bnhub_featured_boost"
  | "bnhub_host_subscription"
  | "broker_pay_per_lead"
  | "broker_success_fee"
  | "broker_crm_subscription"
  | "broker_document_fee"
  | "upsell_featured_listing"
  | "upsell_analytics"
  | "upsell_marketing_boost";

export type RevenueStreamRow = {
  id: RevenueStreamId;
  label: string;
  description: string;
  /** Where configured in code/env — auditable. */
  configSource: string;
};
