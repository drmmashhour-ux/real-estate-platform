export const WEBHOOK_EVENTS = {
  LEAD_CREATED: "lead_created",
  DEAL_UPDATED: "deal_updated",
  BOOKING_CREATED: "booking_created",
} as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
