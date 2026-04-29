/** Mirror of Prisma `ImmoContactEventType` — client modules must not import `@prisma/client`. */
export type ImmoContactEventTypeValue =
  | "VIEW"
  | "CONTACT_CLICK"
  | "MESSAGE"
  | "CALL"
  | "BOOKING_REQUEST"
  | "DEAL_STARTED"
  | "CONTACT_FORM_SUBMITTED"
  | "CONVERSATION_STARTED"
  | "OFFER_STARTED"
  | "DEAL_LINKED";

export const ImmoContactEventType = {
  VIEW: "VIEW",
  CONTACT_CLICK: "CONTACT_CLICK",
  MESSAGE: "MESSAGE",
  CALL: "CALL",
  BOOKING_REQUEST: "BOOKING_REQUEST",
  DEAL_STARTED: "DEAL_STARTED",
  CONTACT_FORM_SUBMITTED: "CONTACT_FORM_SUBMITTED",
  CONVERSATION_STARTED: "CONVERSATION_STARTED",
  OFFER_STARTED: "OFFER_STARTED",
  DEAL_LINKED: "DEAL_LINKED",
} as const satisfies Record<string, ImmoContactEventTypeValue>;
