/** Placeholder keys for host lifecycle templates — actual copy lives in automated-messages API / DB. */
export const BNHUB_MESSAGE_TEMPLATE_KEYS = [
  "booking_confirmed",
  "pre_checkin",
  "post_checkout",
  "inquiry_reply_suggestion",
] as const;

export type BnhubMessageTemplateKey = (typeof BNHUB_MESSAGE_TEMPLATE_KEYS)[number];
